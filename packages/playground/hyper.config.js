import auth from 'xhyper-plugin-auth'

export default {
  edge: false,
  plugins: [
    auth({
      secredKey: 'zH4NRP1HMALxxCFnRZABFA7GOJtzU_gIj02alfL1lvI',
      authenticate(username, password) {
        console.log(username, password)
        if (username === 'admin' && password === 'admin') return { username }
      },
    }),
  ],
}

// asdf asdf
