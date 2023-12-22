import { ZiroPage } from 'ziro/page'

export const page: ZiroPage = ({ loaderData }) => {
  return (
    <div onClick={() => alert('hi')}>
      hello my friends from jsx
      {JSON.stringify(loaderData)}
    </div>
  )
}

export const loader = () => {
  return { hello: 'ok' }
}

// const Page = page
// window.root = ReactDOM.hydrateRoot(
//   document.getElementById('ziro-app'),
//   <PageProvider>
//     <Page />
//   </PageProvider>
// )
