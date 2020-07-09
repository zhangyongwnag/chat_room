export default function (state = [], action) {
  switch (action.type) {
    case 'get':
      return [...state]
      break;
    case 'add':
      return [...state,action.data]
      break;
    case 'set':
      return [...action.data]
    default:
      state = [1,2,3,4,5]
      return state
  }
}
