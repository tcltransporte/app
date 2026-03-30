"use server"

import * as companyRepository from "@/app/repositories/company.repository"
import * as userRepository from "@/app/repositories/user.repository"

import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus } from "@/libs/service"
import { getSession } from "@/libs/session"

export async function findOne({ db, transaction } = {}) {
    try {

        const session = await getSession()

        const db = new AppContext()

        const result = await db.transaction(async (transaction) => {

            const company = await companyRepository.findOne({ db, transaction }, {
                attributes: ['id', 'name', 'surname', 'cnpj', 'logo', 'zipCode', 'street', 'number', 'district', 'cityId'],
                include: [
                    {
                        model: db.CompanyBusiness, as: 'companyBusiness', attributes: ['id', 'name'],
                    }
                ],
                where: { codigo_empresa_filial: session.company.id }
            })

            const user = await userRepository.findOne({ db, transaction }, {
                attributes: ['id', 'userName'],
                where: { userId: session.user.id }
            })

            return { 
                company: company ? JSON.parse(JSON.stringify(company)) : null, 
                user: user ? JSON.parse(JSON.stringify(user)) : null 
            }

        })

        return ServiceResponse.success(result)

    } catch (error) {

        return ServiceResponse.error(error)

    }
}

export async function saveStatusConfig({ db, transaction } = {}, { id, description, workflowIds, typeIds, isInitialOption }) {
    try {
        const session = await getSession();
        const db = new AppContext();

        const result = await db.transaction(async (transaction) => {
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
        });

        return ServiceResponse.success(result);
    } catch (error) {
        return ServiceResponse.error(error);
    }
}

export async function findAllStatuses({ db, transaction } = {}) {
    try {
        const session = await getSession()
        const db = new AppContext()
        const statuses = await db.SolicitationStatus.findAll({
            where: { companyId: session.company.id },
            attributes: ['id', 'description'],
            order: [['description', 'ASC']]
        })
        return ServiceResponse.success({ items: statuses.map(s => s.get({ plain: true })) })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function getStatusesConfig({ db, transaction } = {}) {
    try {
        const [statusesRes, typesRes, workflowRes, statusTypesRes] = await Promise.all([
            findAllStatuses(),
            findAllTypes(),
            findAllStatusRelationships(),
            findAllStatusTypes()
        ]);
        return ServiceResponse.success({
            allStatuses: statusesRes.header.status === ServiceStatus.SUCCESS ? statusesRes.body.items : [],
            allTypes: typesRes.header.status === ServiceStatus.SUCCESS ? typesRes.body.items : [],
            relationships: workflowRes.header.status === ServiceStatus.SUCCESS ? workflowRes.body.items : [],
            typeRelationships: statusTypesRes.header.status === ServiceStatus.SUCCESS ? statusTypesRes.body.items : []
        });
    } catch (error) {
        return ServiceResponse.error(error);
    }
}

export async function destroyStatus({ db, transaction } = {}, id) {
    try {
        const session = await getSession()
        const db = new AppContext()
        await db.SolicitationStatus.destroy({
            where: { id, companyId: session.company.id }
        })
        return ServiceResponse.success({ id })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function findAllowedTransitions({ db, transaction } = {}, fromStatusIds, typeId) {
    try {
        const db = new AppContext()

        // If no status is provided, we can't determine allowed transitions
        if (!fromStatusIds || fromStatusIds.length === 0) {
            return ServiceResponse.success({ items: [] })
        }

        const uniqueFromStatusIds = [...new Set(fromStatusIds)]

        // Find transitions for each unique status
        const allowedByStatus = await Promise.all(
            uniqueFromStatusIds.map(async (fromId) => {
                const dbFromId = (fromId === 0 || fromId === null) ? null : fromId;
                const transitions = await db.SolicitationStatusWorkflow.findAll({
                    where: { fromStatusId: dbFromId },
                    include: [{ as: 'toStatus', model: db.SolicitationStatus, required: true }]
                })
                return transitions.map(t => t.toStatus.get({ plain: true }))
            })
        )

        // Find intersection of allowed statuses
        if (allowedByStatus.length === 0) return ServiceResponse.success({ items: [] })

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
                where: { typeId },
                include: [{ as: 'status', model: db.SolicitationStatus }]
            })
            const typeStatusIds = allowedByType.map(t => t.statusId)
            finalStatuses = intersection.filter(s => typeStatusIds.includes(s.id))
        }

        return ServiceResponse.success({ items: finalStatuses })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function findAllStatusTypes({ db, transaction } = {}) {
    try {
        const db = new AppContext()
        const items = await db.SolicitationStatusTipo.findAll({
            include: [
                { model: db.SolicitationStatus, as: 'status' },
                { model: db.SolicitationType, as: 'type' }
            ]
        })
        return ServiceResponse.success({ items: items.map(i => i.get({ plain: true })) })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function findAllStatusRelationships({ db, transaction } = {}) {
    try {
        const db = new AppContext()
        const relationships = await db.SolicitationStatusWorkflow.findAll()
        return ServiceResponse.success({ items: relationships.map(r => r.get({ plain: true })) })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function findAllTypes({ db, transaction } = {}) {
    try {
        const session = await getSession()
        const db = new AppContext()
        const types = await db.SolicitationType.findAll({
            where: { companyId: session.company.id },
            attributes: ['id', 'description'],
            order: [['description', 'ASC']]
        })
        return ServiceResponse.success({ items: types.map(t => t.get({ plain: true })) })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}