"use server"

import { Op } from 'sequelize'
import * as dfeLoteDistRepository from "@/app/repositories/dfeLoteDist.repository"
import { getSession } from "@/libs/session"
import zlib from 'zlib'

export async function findAll(transaction, { page = 1, limit = 50, filters = {}, range = {}, sortBy = 'id', sortOrder = 'DESC' }) {
  const session = await getSession()
  const offset = (page - 1) * limit

  const where = {
    companyId: session.company.id
  }

  if (filters.nsu) {
    where.nsu = filters.nsu
  }

  if (filters.idSchema) {
    where.idSchema = filters.idSchema
  }

  if (filters.isUnPack !== undefined && filters.isUnPack !== null && filters.isUnPack !== '') {
    where.isUnPack = filters.isUnPack === 'true' || filters.isUnPack === true
  }

  // Range filter for date
  if (range.start && range.end) {
    where.data = {
      [Op.between]: [new Date(range.start), new Date(range.end)]
    }
  }

  const { rows, count } = await dfeLoteDistRepository.findAll(transaction, {
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    include: [{ association: 'schemaInfo' }]
  })

  return { items: rows, total: count, page, limit, filters, range, sortBy, sortOrder }
}

export async function findOne(transaction, id) {
  const session = await getSession()
  const item = await dfeLoteDistRepository.findOne(transaction, {
    where: { id, companyId: session.company.id }
  })

  if (!item)
    throw { code: "DISTRIBUTION_NOT_FOUND", message: "Distribuição não encontrada!" }

  return item
}

export async function getDecodedDoc(transaction, id) {
  const item = await findOne(transaction, id)
  if (!item || !item.docXml) return null

  return item.docXml
}

export async function syncDistributions(transaction) {
  const session = await getSession()
  const db = dfeLoteDistRepository

  const lastNsu = await db.findLastNSU(transaction, {
    where: { companyId: session.company.id }
  })

  const body = `
    <Distribuicao>
      <ufAutor>GO</ufAutor>
      <documento>31038005000137</documento>
      <ultNSU>${lastNsu}</ultNSU>
    </Distribuicao>
  `

  const response = await fetch("http://localhost:5100/dfe/nfe/distribuition", {
    method: "POST",
    headers: {
      "content-type": "application/xml",
      "x-cert-base64": "MIIiewIBAzCCIkcGCSqGSIb3DQEHAaCCIjgEgiI0MIIiMDCCHOcGCSqGSIb3DQEHBqCCHNgwghzUAgEAMIIczQYJKoZIhvcNAQcBMBwGCiqGSIb3DQEMAQYwDgQIGlngn5uZ+G8CAggAgIIcoNXYEW4j+iYkdWvge3Fe5fndUN5oCk471eKF/GrQyCPEqNm6kMwdyGWr2L8yeSIdIoQNVmEshaatzwtsayoKUj4Ah3dg/j43rDcs1uzWtHMCXc5NAkOJkJ18VFN7mOs8T2MvR1AIgB+ZJezlWbXcA2kLqgShC6Fq2Jsy5McRv7WKqfqB9TEDg6qqXDCHCcggg+9Pxqx7RgL2ZVEefqP/FgxDCOKlwAwHaimVeMs2xIaFk3lQU0hzvaFcCtvPJCOPHocgmg68+K0GckIP0URW4dpzMPNNZQEtO9kAcU1Lf6u7KB3rFOsxZxW+1N033Bti+kWvIC2YjFI+AKqvhPvryqVQOCS0cmFR8DotOHHEwP5XPeLPrhMq02WxYA4dFnBqnGHm5pxQIHKUVpLE5/ZOJURV7LqS18XummcMTGxaij++FR/uw9X+2vY3XqMGvMHiII2uKEX7ftKs2F1aBtqv5xURnWDiRMMKN51yxyUQsOmBSY+hH7U2Vl6GFwJdP9l+GHRUJbdkC6Ijj73ssGKavH1MRUV34Anfpp2xesXRqhsZAkMhkAjKnB8Dyk88gZRkCG0bv4fUOOnmldo+AfgJhqOc1eMlUkV99WsD+8RgcXnQdEJ2IkfUQDHe5TKjUX3iSHjjxAsFiGm+B1RtIL/XBQ2nwpqdEq4Tqta5FGIeCyLF4JP61n+05giIGLuLXyINHmNnDfb+t+uX7YymcxCS30bWXkvbORhdQKdA4QXcFA7YfcQE1o5EgOpgA3EQQ6QGNbyr+NWHBwsezEhyyBifI/vqMYMNpcj2lm6V+ADXU1raToBs9Q7IcJKSSrapxxlOZ5tBIoXbA0PxXlNf2xpY9BqnRVfNNHppjycnwwUMlu/M95ObF/K8vpeumnlXXhLJSh+oaxZTGuTENikVynehUHHv3NWEDLilz3/qhP48Kf1Q0DWDjg02TWnOdG7meKWzHRzuXSasCjf9DNDnB1yH9oUUi9ttAxRXPk/uvoXHHUNJT4vICEibJ0so3Q6fR7SjfWjsj3xdGH0Jbuids3lykqv/8M2+9BtBvftgGJP88PXmN5fIUpTc2R+J+T14hvTg9thsuLQZQx9PcOfuOWlLIzugwm6yJQcTWFYbxulmaGVgz7ptOT+L2ZmLdxRMLQTWPhzCW78VipwfLz0YIAPLNX7aN12EdBb2Bb8SFMz+gLu1rtDtefdTLZH0chT8Tr7BXd1UeXO0tkj7tzaIXvhrLNH7w3onOP6azM0D4neJ6ldXRHCsY428E5d9GxoibcvLfBpz/ftyf7UHv1NiuUcfZREwsiFX12KpEgB4kEt5NemxP0eQtUKysmGU9qpVDoK6OjbdqxgT4IMFg0PLsTs/KQrroD441hWMeZImerQY+ZUsriI4qA+VHUjODg18PEn5ODV20FaK9qnXqMr2dsaV8PO0VXnng2rv417LIjBNetNRAZmOj3RIbKD5pk7qEEGdj58F3qt/PDotFj6r85uZcPdNUbxhx3ZGK7hF9Jvd+F9jZ+84kKhSDszPKl1H6DBCjw9CJQtpyfxwSGy3WrPh9I3Y3SB/PdzXX51K8L5M51gyfBpLGV3raiQtD6FC9YPFAubvPgXcexkXL+WOXgSmmdRnZxuz/EqntHE29bDvQWgvAAQHlgt0TjeBi61n8kHH5VMUSiuENGWshqYd5ptX/THGsAeDWZNXCBywuvXMGlu1tn7qg3PkeD1k8rGRQseCx1WXdpfmaecDIJVoyUhYqrbl24iGZ3Abbq9ozB3NxRFKVBPowQwBQmPN/JQKaKNIpiBY8OvAcDmm23A0FHSHatm+HLK0LxXgpAe2T5KO+IS11u4wYUL2P8YJ/WC2f4jnAgAbb/91NVFyUpbuxEp1wnXKM5TOsIZ8oRz831w/h18LQpXGtQDyxJh+IeY1pvrzd+Zs7d4rJ4P+xmqCs/zo3Rd3vvwUASu9wz/CV3sayO04j5ha1Wgtei59AFjp2NtrbiShtZpMwqy1RqJ5zPP2FNLCdnIV/edxXyP2uxyabZOFLDt0f64+TvGXScsUDIvgyt28YtA6NMhuQm/TSkfthsW6i47Q+3yg6UYphv0gens8/dyLFg42eapeNpS7EWhlfSmttF/BPFrM2YiprfOzdJE75eQ1kJZxGOP93gLjNlT+Dii/aqaQmK/PLanPNjm3GrwI+DWfMhopGfZo8h0gbIKp0hd+HgfuqFVKVOd23aHaOCeS28noOQ8NCoorXfrwPW9vAng3MVSnT/dQzyQFbzS4R2tRO7sMwvUUpLUcq3KoC3wZ1GlM+PwHUl1E+QGrqPGp2jnnMXsKjOKTMqtQ2LAx2L9hfzDWu6px/h4d0nM4XtM4cMj7oVHnKoeMHSDUih7SZH6jXoCsMs6Wtrpx4WA32Pr/gAb66qq1hhzay9lbcM+zUV4tUQa6O5pfpogBLBdqmGZjdVLnQ6F3TKyvwrD5+/JLwBGOq5RWrphdKZNzt+TlP6wmDDjCXY/+nxUhrlQnPoVo0q9S4C3JsioMkUqxe7AmlnF+6ST1ZG+umRXvbrgyAsDj3bgX8en0CpKkv630zboYR6NnLbR9wF/dzxOgtxa3J2EWCNQEas+9DptVG5kRjeYwHs6tteovzcBFuTQlEuS0NatDeHVN3UGtZ0xEH1xqJzmVkSp3rPlJI7Gd2uCnE2T6ozf0atMkB4WGKVFsE+sRUX0mCabi3U9efgzQ+8K3cxd+OqZKJbnGtxx4KuiIxyHPIVvsu/oGLdlR2GmdnbG/cX+ziY7Ekc40eh+aczqMkHSHH5VGcTXqUvfgD2DAW9X8Tjmrbv8lUEZD4GSQVfL7Sj1ssnLrORJ9XjTnEznIRpki2P0FoDcmlXphCvt6Q3LqgG0LWFzjPtq/5i78NOBULplnQepLdyoQWkvEdDDvdWnawKV6q1NZSskZZTa/KT06ugpxk363YKxZFrUE7sZNCy1th+GYIFISehHT1AgSa/vgRQypnciyJWSdOAE/K9gGQulc0UPNSoGGHuTU/SaYMAlKmkTIDok790QQPJI3VIBXJStNig3PPUR/GzoAlWr7KjWjRHEeLO/8M4yFvqJ3ji1y1TINL2UU2IaI+t3jsicfel4SNEgXOnPigTRXypnrz0oQgcZwCLb/KRxHxDDQswa8tsf9rLZCXjvWOzyHSg7aXlxKgISLtaIv5Q0ZpDlpjb3wETA2bS91BiBhUDq4mWeVhhaP8/DcUZVyJi/cICnoKYtcqaWR4QiJemrd7fZRaO2q7g+HSLmpWxTY8891ZAC9D9r4NF2hLf3z8EdkcI99CGbS0CWxfYfnYXcXhcOM+i+KzxmHe983KuadKaXcooRhmDOoBA/8HdazxoKMwiScxI8HdehKuHP4qROgMlGHEGvHF0jUq/gp9dbWuZ+B9cX+pj6dTM84+CNafEL7RDNc9qArLGZ8J79THAeLYIm+c0yQ8aoCSxFlir3jiaHMhb6v4+KBwaEXZk+PfRd+K33CG0QF7Mcu7NHAVDDFhPfMTwpH8QR6C1IwaBDLtFppn++QFJinIyJZbcDSdzKdxEbb2iQ1SFc75kzRTGNim9Ce0xw9r6vqdzmbwp4LA2GxQ19qc74/0AfuH8PqvI+QDEVW85g7uhhAkqohOLylW7+fZ/7lkInDkyKHm+q5LSOYTNh/vyu5EPzsROHQgpQEJxRQDl3mSOXzy0qo39w8uczesy9spJaY+geI1vegAOou02q0teM9zQSvdKgKi6ac46kCiCKnJ1IR51FJGdZDis3xEEHjvDcDQgojCKuNQPu9QoNOqjxvQA1tjMpCts6fv6vPhTU8VxUvEaziuOSpg2P10w9EfrCL2MlkoeG3MbaQpwnDiNVYDs0+RFLznlqwNZ2BDHgXqU9yS+KyJQqdBxcz33jMWzjUfyBAFyectKkUtAxrUpjIngWqs+sy68+dVtZpmfpGH745C1/fhxxbcf5D4eTJWP74saxTNITPreKCwZNCl+GT0yTcPEjVKHseFv1ycX/yU2ivvL46pyUoqtzrjXomlnpIp3g0UnPEaOu36ZrwRulJRCgSyAgzZbIBVJ2AGBh6rKluzRV+afYtCMjQ5cWF9uNlzUqZMkg94ON0N3mxa3rU3W8CpQjnoTT2AXVCLvqVtEbSZqvo1qc5cMgPovXYVF5tlqFy2BvyVoUu1bcxYJEP890UI+7ts/Q9XnYomLnKQlm1AnvI76LOFgVI8fjw/o9ZAdtQfXKtbM+7jbLjJ7c3awXVLZ55orf2Fqqrb/n6j2JcYz6e026Ce5gRKe3ze5au6Z2taX2Cg8RGu4Yi0T9qiYpN2Pn9PCYL/AFVvbxdNOk9/zHXIgPgQA4TSZX++9wVsCR5NE6mBKV60UdsDdPeFn/B9HfIn9mE3yJ89OP5tE6uRYw3PzFCPU87636ti6MWFggi5+HMlYmef5xS8pC/ztsm9wWfSI5l7xwlLSi9gNlDgoOqRBfH80pHZv7W1VmFnmLhCfG4boLtKoCYscbpRT9YPi5yc3StRr2U0lZovDxZhL56M+XgoDSMq5VdTJByQiBieHfdLHSdxQI3tEvD5RRzOngGrz3rj3ACUvcaZs1QxvE0ikwpyKMMCEm0yg/78HA2c20JSo31KZMmOgDpcRkRAXhL5wHTcsYacNoAzEg00STlj2jCfztCrp2a5+j2Uts2A8qiKf/4/nbremw7pNDBcvBlJDQZ+fCe7dRfCYWlUqn1iB19CGpM0CYJu+QtQyOytkprikXIgrK01TLYK485L4TypXSMxF3vVDBx+z/e4+7MV4iupa9FljMumUZQhZH1TxmW2rkNgnfpgskLfZXDCKMfS8k0qk6g31TXzSktN7brpt1j6ePAr/oor585NF2pHOBn167dYZSCMmXgTWZXKR0ew9Kz7YbfKsD2oEKMg9UKLOqm/mtlbMIV7ZfBcvj6vnIiV6Fz4+nx7Ht8qBaWCm3kVgMCtKfuP0J//9idLNfxsSDklhJ5cLOZ8xcl5eqncE39vF0LxVPtFZLaWeSBzqpd/a5+3CD5nBSYnvp+WuajQfQeTQaWL0ZQX8B7jKQk+DA7rcxN6UBu6EBXhoY40O9XbX5bB5QAAv2fb8s6zP98rk9ae45VHbt7EA/llBJ33fnFK0Sm83dHYAWhl67TSAUbZ6nDYmKX7E089zlgS09t70SgOMzrPsEijdLIkqekOb7r/RMweHH1tEct+eJxwYPQyUsUEBMKdvBiOGSHpR1klLk2nIUZFNFMXd/Y8hTFajSoR3Xk56WUaqLiClMkts1JvqpqVaLzHQa7jQXwrMRnlTCQDpeF2HvHbY6jzITJ4gJahp/lAmmUO/Drk4X3dZOHT+HWt3Y92OTFz9LNcgoj4pEKA+u6AAxLXI2nNbOaFamVUJwp+LDIL6In2kGh8GT8xLWfJeJJaryV8Wru2+gEriFj4aAkK9tsSeSIfSOuwUGqZPTbSRQnwEhz38gCWyDnM6cZ7cOFfDJv2aQyyIl0v77c196ieKF6jqlblLLJGeyzYE+vLIvRdL7DBQGhX4ELxs6vDgo0+SZDR2ECuUN81QJvcECNFEZAWe3SbcebhDhlJMBDrsbrH53lHn7/L/d/Cug25yTWmlfpLhQ0h2v7aXYunzIAYxkUg0ZCtGihubOk98ILVpOIU2XOQ2XD5+P2+GNIfG8Iunl9Bji0WT4x6uUpx5ATgEE0f73umE5sPGRoe4WI8McMnPC0S9OscT9aFWx06w/9jhe/l9M8BAqGZE3P5k4bWkRTuo7IMlv0Mo65x9amjIU9JGSJ7+MAHLSe2L5Vny3PVkH9xSO+/lVMMY2fLqMY9ddeibvltqaAMKSUS1jkBOiB2sT2TesBNVe59YHdnGA6Zvj1fBIDIlU2pb8ycwzbg49RRTtWqN04+hVDTBjINlJgh86/nLI0QN4GACRE6Sk6eXH+LYshTcj8DPdxoxIeBuxIu4z9kct3S3WuVhJ4tO6fqy+/3uFWjqBgj0cQYp4QEAhnoB98KkIATF5vvhVir9TPXIy921VOGsHR4Lrdj6v6a7FITGDm+9v85gBbkDVFSjFgwn4HcX0e2gJP0gyEw8AJMVZEHDgKT7cjh26oLClFCJaXssy1cuccxmxYz+y9EB65Jn7EgS+4i6bSf6B8A1hSqFXhJ00RR8F2eJXIWyEtjfFEgnDtdSXqZcmwmKAep7dmgX/b0F/PQzTQx0KHRrzqKF9818ROBPQYluiJDqHcrp/inECoWDpGCD8709mwyCRssDosJgMl+MiFEHtyLSI7WJqPluu1YiWzhu8W6crdr6htqAH37NbpwmYAvQ/gaMJoaKUanItkR++nrm5YRgiXJ8I+RFbpvBIX1uu+pJ8QtcacebfY0fu1joVlIvckPeD126cojk84ksxbn6dR9k78cacxVRaG5/ER7FAE2e4IM0x+EOCNdRR5q3iRPBpTCqPy/CfFRC1Z4LY4mGKr/XnVY9RDlxZBQr2UGiHQUyWtIZ/PUZORaogxOxgipDwvPFWYCrp8dWql1nKiiRpHLb5ZqwIVoCXe5SCai4OIRLo2bHLcj6shlP1W4OZ577GbaXww4+yfXtKLamiOPQn8pjoP5a/6l5sRnbe4FL9ziakdwHDmhlf9khcC7TA1uvz84dcywcNxpb+nzheUra5fts1nmxHUMoI+deCDPK+4khCvCIf1hmW4zP6xttF+EH7zrlbCLXfKge2djM6NfB/eXjvbU2sZuaeFim61LYxBg1JqMDbpu+kB4PRxSj06aiO7D11Rl4ss3g4pV1olcADmKAgy5dl7O29NlPtnCUr3rhTlKw2tDV+hpVGj7mnEwOSreghE+l8jslDuxg4vOgJUmTxibMBjjE+uPLXw4NGj72CHx4cUSMb9Vsqo6BMQmzT1gaYWrS3OpVYMk3uG81dKj6YN416Updw42pI47V7NLRJcmLmEuDTG/VsgM3JB24jPBsCxpPVFTdY/5euvmliI5AivgVfC7rmoZrM1xRBRRX273pgiw69ClhrknSzglcNPjooSNdooDFYAQSqx0cYRq69oe/m9SJxdutWbrUkuwtkkVblEKp8nxyApaR9dfUbYJ4UrUaGudr/Ujl/p7og29DnHJIIIjEVF6RhfcUHSYvZIfsEwFokP4i4mvRodoA0R2UhQ5HOozbdl9pWBUNIF70G65VtKVzC9G2aBoUFQFuxsrbmFlcw8Q3MIYs630JiStOYv3rVkGZRdFHutFKKxqY6weG+kvN7r94PSrWvhaUlNbO25nCmfIrfejyGTNnA6t1OEy+EE+ypefHueSoPPuf/R6HqMBhbVgTs2NlAk8nACqDg4ja4ub3+1e8EvYknnojAGJz27x6u1FDV5oFySw7YtNImfJ/tD/8J9ncVW68YfNIWmmUIgzdkdXp3W3YvbC31e/dClyB75TJFF7jWe45VBGNdBvWbljr069kT2I8QVsM2QmIquQzxzk+57snsxbr/AOjLvjwHIRzJi8x9lhkJOXhI6knRgUA059czMSeqO9ZglgWcY/45QlYpVs/uQygy8aCLXVCwmPnEex3Zv22bj6VF1lesJWQ0HExJXCtE+kP2hQPFiiOIr3dqRcpXR2MWQp2zGgjLWSiu0f50djFBQVFFovHp9m3/GUERZmP7dOvNvHUPAixOKRuHPrBwnF0IhZVyw69LHaApIKDymtdfJHIE//E+E+tiHqOK7Ol0a0TUuHfZ/Su+Jo/MZFtOey6Gh8n4sGaFt6i3fzzHwDifhSWVRV6lzLdlkgCPoWCF9w3n5HloffCk7bO0CFzS81UwxUbQv4IS4PXlNTNU9Y2lTYYY5FNh23pM4VvVb66VsrLuBMUHY3ZUKqbbcxXGRgcjkquk1ghEkc+Q6lQMjGUSYOy3oZYfbXeL3+4pnMmK/UvrmTpwQdIaIgubah9Z4KpoU49G2JbymVLd22YvEUqUHwAe1QvPqRajQnbc5u4wp5VGm6g54Ntm65p3L9KfWE9cFip4R31r4c6qbOzLSx8efWWt+OZgwuwFhTcjjlDtMnQ/9sJc5/bKN2aKEBNO9q+/AcRSs6D15yXc+a7pAa1gL/7bxEereQEaArv+r0s2Vr2kbe0pqQ416XQT0Z02dO8DdeC1dUO19w0pewa1yNL4Ddg4+K/SF+aFrK/ERhNMX8snUZgzpBvooVtrAs+r+YfMKjzpgaOP6SkXvaLuTa2EGat4MJJdRHni0t7nTuqxgu53hOJH8Uw+qdBX/D5lzJtSFHeEo9nheCucneO29uNYox1/wRbnLe+7EtmsHqjaBKYTI8ITGv7Ktd9JTQM4vVUqLcjljn07zOJ91K+nXQ77S68siiqsTWJq0uAl9WsiTxTUkpDyWJKmuFvnkMa4nV48GVqjVbQxO/HOX4jw6TRisH4RPK68vl3tDaqBtrptGcgOkA6s/0e8xTA/FqA93vG9k/swnr1hXKZvqbdHOTq+M6e8B5aVY7NlKXSkrzVmb/7hNcDQZqYmESd7+Lv0vb+rRTp0QxNR/rexzdcw+X4rK0TjH6HogrZplWqnzdqkndP2kFX90qvijVK6nrx4WQBA0ZEHyEdbEyNlldPapB0KbAZzltydgEVKqLgGPMLIcqlE84gE7NHJ8ZacRLxSwTIynSEhSkT2i3TqoAHwcWl2g4IDnUqCe7uA3tZLrr9cTyajbOAG4TogfKJ+fgHiW5rdgZj8fnPPPC48GqWpRHikZz7UYWVoA4iQXNTfIUeltbV4Jyg2j4A+eUaYw0Z40npLpBRKjqsanpdd5kISprrpoOyyKGdLGH9KSTjKtoKH12pPNC0pZgdJUd122zxSQp4+aKxEK9unY9CN6JzsrQjNmXO1Mg4t9e1gBmtvUdYBsVIyqxj73MwxEiUfSakK/2qJIFtiXokb9EF+jyHoogheyw3y5Vx6pCHq2XLJ0bRoKN2iZvFxb+vy8ZpDxuiVgasixNzWEufDiEtw3lzRTV/SgAVHGH4Z1AayJ5JZSsdKPWPUI+vUHHm1WpxNjN/TufV/qHrqa2UPLCCqDor4dOyQ2wf1Z6K688NMo9G178WvdXcCD7mv86bLMdhFe9QgrpUoOHihAX5tzXvJ3mii3+aWR2qs3WLkvTCQgBC6McozSmoC1xAQXICKB2laBIp1v7Lj3NAXjp13XrCMfFPoTwIcseYHaiqsTBxynpkI7BpLWt1WEhBmsBLnrmTt1TEm6931feFs3ye9aMkLsIBBI6LfwK1FEa44XiJ2BsREItqvWOFcchy8VEMfcF+QA4ctfDz+IMat1dMuJoEJas9vjH3qncpe8I2xZA95/7V4qz6M/jpx8lPflCOWv8URs4a5zwkXoY7hSjehMhSYveo5gRBmJDjXYVuONQlyv+k2/OeZA1YuTkiXQ3A8biaMb+QG+s8mmO4GBYAfphsLo2cGH0SZoLQyOpYhYtzhJptbaDtUNp0lybLyarq6kUSBG8BpSqr5cK4S2lsgzwLmHofrObF13Ae1F60dxPfG4LDuWnckYV+UE8EuGcrapd1zF48qLwTjV5hBUdmYGm2Hc2duACA7fh3th1i/JYF6r/WLJogDnAZq025bpPbcxYIVQyVXakt4GCLKg18D5I5EqZRdsGE/aysENmF/zaQYwHL+nshJHjCoe4Nmrbe8oY5TIoX+kv5dgJ3mh4ASFZPkC/4ZdG2t3NySgYixtDRHGqkxYJROGBjnxG42yDhhG+z81m6hTgLAO36qs25z+1rL1Fz7GFy4Q5bCc072AmeZQUz2aBJWbFgKWFnNjA2hK67QhEUtn4W0t1dbdNQwSMIIFQQYJKoZIhvcNAQcBoIIFMgSCBS4wggUqMIIFJgYLKoZIhvcNAQwKAQKgggTuMIIE6jAcBgoqhkiG9w0BDAEDMA4ECLZkjwJNUngzAgIIAASCBMjnju/k64CrgqaSGDAIKxbVpHI5JNJXLMqsMlrzv0xIa2wuiDk0Gfc8kVy5ar9kQ3DRjoK4X4M/6ruWcKKbnlbw1TwFLdR3ClnC77QHF+ALqRSvokyH6Z3J7UNX923orbnytQyPSewGkI5j7I7GhBwUJlY8tuKTIVJYma6bndiyxwZ3jkU3f6gcXzpgleX9spxAwULaAPq0Yc3mxpRpbtufie3bvlIhKeryDLvnn0F70W4QRKgJK/kXdo+ZZBAn2ct0VOFdhszRFcoW2k0bSlClAcyhsBF6SJpUbe1aX/vUWhx3Xb4UJTtySdyOTg5vAAIYLZHh7Jy5MmUBC14UWdJqAhkyZ4Q90nVN+KmUkaZwPk3Ki4LDKQcCY7I/7Zg7nDLG4AqmzpujqansKZ22b+v8uz9XYemKY22OCicwu5alP3AkxcFbMuoHGwAUdkt0PjgFkFK0pkkSTzPmDA3r0RK+l0ioFf7m8IPp+fY6N5Lo7/7r1QJykFvFMTozuq29FHVxAPCV7hZGXCDgC3ed0Qd1dtCnNAnplKGhdlE1g6lbVFJUP6Xehf2cSddoNuSuFDeYRm5aMJkgzU3hCyKE/56cnKROzEchxKR1tbGLH7gJ9bEuhM312YFOrj3m/sNOwSM2P+v5PB5293h5gvJMFIMFDTJO0Q6SWp3r/Gh+aFCInm7ihnIsOs6E0KSvC+5lhvBWeNZm2TYVOGQ61rHzlNHgTLfkwhTwd2HNoUCXxOIhONo/NtZw318uFYAZDZvaPm2Ax6kFEklLF1qkSKcEkSRyhC+OXW3znKUBDuzKcrTbvlk+TSb0+iVK3RBsz3GWO66TPCz+8UueHfxLkprw/nrQGKF8cH22TjtSwEaZBSvQY2k6OypTkscJpD6NZw+S1fUu67eBMkSzFYqb5eTYgHXSfQAp/V/sqL2MP5mHriIT7HSzToAfeDoKY6nwzFUKNEnI/Y8DpcoI1ckDQMAanso0aiIrVjOEdWKs/byQLrYoNIew2olnJXE2rletXQ/2j9k4BUEt7799bT8/zKB1Tola+Rtx7/LzUmhl2S1aEi3Jx6jv8lbKKEayonpf8r2bzrAl2W1UsP/hmtZA6EgFDdTuNge2jOmBbnZGkjABNtJsPk80Mco+eZTOeokowVM0/v/GA94wB/edeUmFZYYheRVyjtqp9s2qq0XjulevstHNEZb+3w+IV2sJPZXbj33SA+n510taK1Be68dsoI6+asc31KH5r2bP+1QmqWep+6XyyNUFrFdW9rh1XjwSHdoQSy+JbyqsrO6QWg5GuUmKNBW7JGw+39c1jps/nTn8IO+a/mCqVecXd7J/iSPnRqN2nvMUH+X8p/I+iwWhk82qaQewbFBmVpzU4h4SspmiqlAP9E56uBc+3U+bPCvAiN4PslvQLyod6Ztxlo4RHBcfOZIpWD3OuwAGZs+sBfPLwhYkwrT0iS/mm9Hzrr57/mnZK/euo8D+0hGiaaE2oGYbLjQ0E18PPdglsiObJPRHnD169dMh84L2gm5a8mQm2GzeNYpYxoo/gahK2yzExCcP1mQnSyCPNRnBvWq1GoIhn4DqR7OjU91N+57igIkunesSWZw0UmeEdzM6CjnYqfyjeZX1x9syisKO/HsxJTAjBgkqhkiG9w0BCRUxFgQUocVYNcdG1JxQEQRo+JIfkV+vr4kwKzAfMAcGBSsOAwIaBBRgnZrLDpo46d4+UxtyLzUDIODezAQI6MqxRjlM7Lg=",
      "x-cert-password": "321456qG",
    },
    body
  })

  if (!response.ok) {
    throw new Error(`Erro ao conectar com o serviço de distribuição: ${response.statusText}`)
  }

  const xmlResponse = await response.text()

  const cStatMatch = xmlResponse.match(/<cStat>([^<]+)<\/cStat>/)
  const xMotivoMatch = xmlResponse.match(/<xMotivo>([^<]+)<\/xMotivo>/)
  const cStat = cStatMatch ? cStatMatch[1] : null
  const xMotivo = xMotivoMatch ? xMotivoMatch[1] : 'Erro desconhecido na distribuição'

  if (cStat && cStat !== '138') {
    throw new Error(xMotivo)
  }

  // Regex to extract docZip nodes
  // <docZip NSU="000000000002033" schema="procEventoNFe_v1.00.xsd">...</docZip>
  const docZipRegex = /<docZip NSU="(\d+)" schema="([^"]+)">([^<]+)<\/docZip>/g
  let match

  const extractedDocs = []
  const schemaNames = new Set()

  while ((match = docZipRegex.exec(xmlResponse)) !== null) {
    const nsu = match[1]
    const schemaName = match[2]
    const base64Content = match[3]

    extractedDocs.push({ nsu, schemaName, base64Content })
    schemaNames.add(schemaName)
  }

  if (extractedDocs.length === 0) return { count: 0 }

  // Bulk handle schemas
  const uniqueSchemaNames = Array.from(schemaNames)
  const existingSchemas = await db.findAllSchemas(transaction, uniqueSchemaNames)
  const schemaMap = new Map(existingSchemas.map(s => [s.schema, s.id]))

  const missingSchemaNames = uniqueSchemaNames.filter(name => !schemaMap.has(name))
  if (missingSchemaNames.length > 0) {
    const createdSchemas = await db.bulkCreateSchemas(transaction, missingSchemaNames.map(name => ({ schema: name, descricao: name })))
    createdSchemas.forEach(s => schemaMap.set(s.schema, s.id))
  }

  const syncedData = extractedDocs.map(doc => {
    // Decompress
    const buffer = Buffer.from(doc.base64Content, 'base64')
    const decompressed = zlib.gunzipSync(buffer).toString('utf8')

    return {
      nsu: doc.nsu,
      idSchema: schemaMap.get(doc.schemaName),
      docXml: decompressed,
      companyId: session.company.id,
      data: new Date(),
      isUnPack: true
    }
  })

  await db.bulkCreate(transaction, syncedData)

  return { count: syncedData.length }
}
