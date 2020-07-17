export default function (state = {}, action) {
  switch (action.type) {
    case 'get':
      return [...state]
    case 'add':
      return [...state, action.data]
    case 'set':
      let result = Object.assign(state, action.data)
      return {
        room: result.room,
        room_list: [...result.room_list]
      }
    default:
      if (state.room_list){
        return state
      }else {
        return {
          room: {
            room_id: '',
            room_item: {},
          },
          room_list: [
            {
              user_name: 'Chat room！',
              room_list: [
                {
                  room_name: "所有人"
                }
              ],
            }
          ]
        }
      }
  }
}
