// @ts-nocheck
import Confetti from 'react-confetti'

export const loader = (ctx) => {
  return { message: 'hello world' }
}

export const action = (req, res, ctx) => {}

export const loading = () => {}

export const error = () => {}

export const page = () => {
  //   const { action, isLoading, errors } = useAction()
  return (
    <div>
      <Confetti width={200} height={100} />
      <form
      // onSubmit={action}
      >
        <label htmlFor="name">Your name</label>
        <input name="name" id="name" />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}
