import { useState } from 'react'

export const Page = () => {
  const [state, setState] = useState('hi')
  return <span onClick={setState.bind(null, 'yoo')}>{state} asdf f</span>
}
