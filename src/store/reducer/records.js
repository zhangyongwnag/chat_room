export default function (state = [], action) {
  switch (action.type) {
    case 'set_records':
      return [...action.data];
    case 'add_record':
      return [...state, action.data];
    default:
      return state
  }
}
