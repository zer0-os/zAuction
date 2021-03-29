const INITIAL_STATE = {
  exValue: "Unconnected"
}

const exReducer = (state = INITIAL_STATE, action: { type: any; payload: any; }) => {
  switch (action.type) {
    case 'SET_EXVALUE':
      return {
        ...state,
        exValue: action.payload
      }
    default:
      return state;
  }
};

export default exReducer;