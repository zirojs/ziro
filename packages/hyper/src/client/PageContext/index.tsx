import React, { Children, FC, FormEventHandler, cloneElement, createContext, useCallback, useContext, useState } from 'react'

export type PageContextType = {
  loader: {
    loaderData: any
    refetch: () => Promise<any>
  }
}

const PageContext = createContext<PageContextType>({
  loader: {
    loaderData: undefined,
    refetch: async () => {},
  },
})

type PageProviderProps = {
  children: React.JSX.Element | React.JSX.Element[] | React.ReactElement | React.ReactElement[]
  loaderData?: any
}

export const usePageLoader = () => {
  return useContext(PageContext).loader
}

export const PageProvider: FC<PageProviderProps> = ({ children, loaderData }) => {
  const refetchPageLoader = useCallback(() => {
    const apiRoute = `/api?page=${window.location.pathname}`
    return fetch(apiRoute, {
      method: 'GET',
    })
      .then((r) => r.json())
      .then((response) => {
        setPageData({
          loader: {
            refetch: refetchPageLoader,
            loaderData: response,
          },
        })
      })
  }, [])
  const loader = {
    loaderData: loaderData || (window as any)['hyperLoaderData'],
    refetch: refetchPageLoader,
  }
  const [pageData, setPageData] = useState({
    loader,
  })
  return (
    <PageContext.Provider value={pageData}>
      {cloneElement(Children.only(children), {
        loaderData: pageData.loader.loaderData,
      })}
    </PageContext.Provider>
  )
}

export type HyperPage = FC<{ loaderData: any }>
export type UseActionOptions<T> = {
  onSuccess: (data: T) => unknown
}
export const useAction = <I extends {}, R extends {}>(options?: UseActionOptions<R>) => {
  const initData = { loading: false, data: undefined, error: undefined, action: async () => {}, submit: () => {} }
  if (typeof window !== 'undefined') {
    const apiRoute = `/api?page=${window.location.pathname}`
    const [data, setData] = useState<{
      loading: boolean
      data: R | undefined
      error: any
    }>(initData)
    const submit: FormEventHandler = (e) => {
      e.preventDefault()
      const formData = new FormData(e.target as HTMLFormElement)
      return action(formData)
    }
    const action = useCallback((formData?: FormData) => {
      setData({ ...data, loading: true })
      return fetch(apiRoute, {
        method: 'POST',
        headers: {
          // 'Content-Type': 'application/json',
        },
        ...(formData ? { body: formData } : {}),
      })
        .then((r) => r.json())
        .then((response) => {
          setData({ ...data, data: response, loading: false, error: undefined })
          if (options?.onSuccess(response)) return response
        })
        .catch((err) => setData({ ...data, data: undefined, error: String(err), loading: false }))
    }, [])

    return { ...data, action, submit }
  }
  return initData
}
