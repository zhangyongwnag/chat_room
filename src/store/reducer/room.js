export default function (state = {}, action) {
  switch (action.type) {
    case 'get':
      return [...state]
      break;
    case 'add':
      return [...state, action.data]
      break;
    case 'set':
      let result = Object.assign(state, action.data)
      return {
        room: result.room,
        room_list: [...result.room_list]
      }
    default:
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
