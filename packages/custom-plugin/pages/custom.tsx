import { HyperPage } from 'ziro/page'

export const page: HyperPage = ({ loaderData }) => {
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
//   document.getElementById('hyper-app'),
//   <PageProvider>
//     <Page />
//   </PageProvider>
// )
