'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false
})

export default function DocsPage() {
  useEffect(() => {
    const originalError = console.error

    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('UNSAFE_componentWillReceiveProps')
      ) {
        return
      }
      originalError(...args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return (
    <div style={{ height: '100vh' }}>
      <SwaggerUI url="/api/docs/swagger" />
    </div>
  )
}