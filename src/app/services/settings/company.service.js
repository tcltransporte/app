"use server"

import { Op } from 'sequelize'
import * as companyRepository from "@/app/repositories/company.repository"
import * as userRepository from "@/app/repositories/user.repository"
import { AppContext } from "@/database"
import { getSession } from "@/libs/session"

export async function findOne(transaction) {
    const session = await getSession()
    const db = new AppContext()

    const company = await companyRepository.findOne(transaction, {
        attributes: ['id', 'name', 'surname', 'cnpj', 'logo', 'zipCode', 'street', 'number', 'district', 'cityId'],
        include: [
            {
                model: db.CompanyBusiness, as: 'companyBusiness', attributes: ['id', 'name'],
            }
        ],
        where: { codigo_empresa_filial: session.company.id }
    })

    const user = await userRepository.findOne(transaction, {
        attributes: ['id', 'userName'],
        where: { userId: session.user.id }
    })

    return {
        company: company ? JSON.parse(JSON.stringify(company)) : null,
        user: user ? JSON.parse(JSON.stringify(user)) : null
    }
}

export async function updateCompany(transaction, values) {
    const session = await getSession(transaction)
    const db = new AppContext()

    const rawCityId = values.city?.id ?? values.cityId
    const cityId =
        rawCityId != null && rawCityId !== "" && Number.isFinite(Number(rawCityId))
            ? Number(rawCityId)
            : null

    const cnpjDigits = values.cnpj != null ? String(values.cnpj).replace(/\D/g, "") : ""

    await db.Company.update(
        {
            cnpj: cnpjDigits || null,
            name: values.name ?? null,
            surname: values.surname ?? null,
            zipCode: values.zipCode ?? null,
            street: values.street ?? null,
            number: values.number ?? null,
            district: values.district ?? null,
            cityId,
        },
        { where: { id: session.company.id }, transaction }
    )

    return { ok: true }
}

export async function saveStatusConfig(transaction, { id, description, workflowIds, typeIds, isInitialOption }) {
    const session = await getSession()
    const db = new AppContext()
    
    let statusId = id;

    // 1. Create or Update Status
    if (statusId) {
        await db.SolicitationStatus.update({ description }, {
            where: { id: statusId, companyId: session.company.id },
            transaction
        });
    } else {
        const newStatus = await db.SolicitationStatus.create({
            description,
            companyId: session.company.id
        }, { transaction });
        statusId = newStatus.get({ plain: true }).id;
    }

    // 2. Update Workflow (Outgoing transitions from this status)
    await db.SolicitationStatusWorkflow.destroy({
        where: { fromStatusId: statusId },
        transaction
    });
    if (workflowIds && workflowIds.length > 0) {
        const newTransitions = workflowIds.map(toId => ({
            fromStatusId: statusId,
            toStatusId: toId
        }));
        await db.SolicitationStatusWorkflow.bulkCreate(newTransitions, { transaction });
    }

    // 3. Update Initial Option (Incoming transition from NULL source)
    if (isInitialOption) {
        await db.SolicitationStatusWorkflow.findOrCreate({
            where: { fromStatusId: null, toStatusId: statusId },
            defaults: { fromStatusId: null, toStatusId: statusId },
            transaction
        });
    } else {
        await db.SolicitationStatusWorkflow.destroy({
            where: { fromStatusId: null, toStatusId: statusId },
            transaction
        });
    }

    // 3. Update Types
    await db.SolicitationStatusTipo.destroy({
        where: { statusId },
        transaction
    });
    if (typeIds && typeIds.length > 0) {
        const newTypes = typeIds.map(typeId => ({
            statusId,
            typeId
        }));
        await db.SolicitationStatusTipo.bulkCreate(newTypes, { transaction });
    }

    return { id: statusId };
}

export async function findAllStatuses(transaction) {
    const session = await getSession()
    const db = new AppContext()

    const statuses = await db.SolicitationStatus.findAll({
        where: { companyId: session.company.id },
        attributes: ['id', 'description'],
        order: [['description', 'ASC']],
        transaction
    })
    return { items: statuses.map(s => s.get({ plain: true })) }
}

export async function getStatusesConfig(transaction) {
    const [statusesRes, typesRes, workflowRes, statusTypesRes] = await Promise.all([
        findAllStatuses(transaction),
        findAllTypes(transaction),
        findAllStatusRelationships(transaction),
        findAllStatusTypes(transaction)
    ]);
    return {
        allStatuses: statusesRes.items || [],
        allTypes: typesRes.items || [],
        relationships: workflowRes.items || [],
        typeRelationships: statusTypesRes.items || []
    };
}

export async function destroyStatus(transaction, id) {
    const session = await getSession()
    const db = new AppContext()

    await db.SolicitationStatus.destroy({
        where: { id, companyId: session.company.id },
        transaction
    })
    return { id }
}

export async function findAllowedTransitions(transaction, fromStatusIds, typeId) {
    const db = new AppContext()
    
    // If no status is provided, we can't determine allowed transitions
    if (!fromStatusIds || fromStatusIds.length === 0) {
        return { items: [] }
    }

    const uniqueFromStatusIds = [...new Set(fromStatusIds)]

    // Find transitions for each unique status
    const allowedByStatus = await Promise.all(
        uniqueFromStatusIds.map(async (fromId) => {
            const dbFromId = (fromId === 0 || fromId === null) ? null : fromId;
            const transitions = await db.SolicitationStatusWorkflow.findAll({
                attributes: ['fromStatusId', 'toStatusId'],
                where: { fromStatusId: dbFromId },
                include: [{ as: 'toStatus', model: db.SolicitationStatus, required: true, attributes: ['id', 'description'] }],
                transaction
            })
            return transitions.map(t => t.toStatus.get({ plain: true }))
        })
    )

    // Find intersection of allowed statuses
    if (allowedByStatus.length === 0) return { items: [] }

    let intersection = allowedByStatus[0]
    for (let i = 1; i < allowedByStatus.length; i++) {
        intersection = intersection.filter(status =>
            allowedByStatus[i].some(s => s.id === status.id)
        )
    }

    let finalStatuses = intersection

    // Filter by typeId if provided
    if (typeId) {
        const allowedByType = await db.SolicitationStatusTipo.findAll({
            attributes: ['statusId', 'typeId'],
            where: { typeId },
            include: [{ as: 'status', model: db.SolicitationStatus, attributes: ['id', 'description'] }],
            transaction
        })
        const typeStatusIds = allowedByType.map(t => t.statusId)
        finalStatuses = intersection.filter(s => typeStatusIds.includes(s.id))
    }

    return { items: finalStatuses }
}

export async function findAllStatusTypes(transaction) {
    const db = new AppContext()
    const items = await db.SolicitationStatusTipo.findAll({
        attributes: ['statusId', 'typeId'],
        include: [
            { model: db.SolicitationStatus, as: 'status', attributes: ['id', 'description'] },
            { model: db.SolicitationType, as: 'type', attributes: ['id', 'description'] }
        ],
        transaction
    })
    return { items: items.map(i => i.get({ plain: true })) }
}

export async function findAllStatusRelationships(transaction) {
    const db = new AppContext()
    const relationships = await db.SolicitationStatusWorkflow.findAll({ 
        attributes: ['fromStatusId', 'toStatusId'],
        transaction 
    })
    return { items: relationships.map(r => r.get({ plain: true })) }
}

export async function findAllTypes(transaction) {
    const session = await getSession()
    const db = new AppContext()
    const types = await db.SolicitationType.findAll({
        where: { companyId: session.company.id },
        attributes: ['id', 'description'],
        order: [['description', 'ASC']],
        transaction
    })
    return { items: types.map(t => t.get({ plain: true })) }
}

export async function findAll(transaction, options = {}) {
    const { where = {}, ...others } = options
    const finalWhere = { ...where }

    if (where.surname) finalWhere.surname = { [Op.like]: `%${where.surname}%` }
    if (where.name) finalWhere.name = { [Op.like]: `%${where.name}%` }

    const companies = await companyRepository.findAll(transaction, { ...others, where: finalWhere })
    return { items: companies }
}
