export const reducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_ACTIVE":
      //console.log("TOGGLE ACTIVE")
      return {
        ...state,
        active: !state.active
      }
    case "UPDATE_USER":
      //console.log("USER UPDATE",action.payload)
      return {
        ...state,
        user: action.payload
      }

    default:
      return state
  }
}

export const initialState = {
  active: false,
  user: null
}