export function ErrorRender({error}) {

    let message = error.message

    //if (error instanceof UnauthorizedError) {
    //    message = 'Faça login!'
    //}

    return (
        <div style={{ padding: 24 }}>
            <h2>Erro</h2>
            <p>{message}</p>
        </div>
    )

}