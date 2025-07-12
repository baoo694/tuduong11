const Friend = require('../models/Friend')
const User = require('../models/user.model')
const { getIO } = require('../socket')

// Gửi yêu cầu kết bạn
exports.sendFriendRequest = async (req, res) => {
  try {
    const { sender, receiver } = req.body

    // Kiểm tra người nhận có tồn tại không
    const receiverUser = await User.findOne({ username: receiver })
    if (!receiverUser) {
      return res.status(404).json({ error: 'Người nhận không tồn tại' })
    }

    // Kiểm tra xem đã có yêu cầu kết bạn nào chưa
    const existingRequest = await Friend.findOne({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    })

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already exists' })
    }

    const friendRequest = new Friend({
      sender,
      receiver,
      status: 'pending',
    })

    await friendRequest.save()

    // Thông báo qua socket
    getIO().to(receiver).emit('newFriendRequest', {
      sender,
      receiver,
      status: 'pending',
    })

    res.status(201).json(friendRequest)
  } catch (err) {
    console.error('Error sending friend request:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Chấp nhận yêu cầu kết bạn
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { sender, receiver } = req.body

    const friendRequest = await Friend.findOne({
      sender,
      receiver,
      status: 'pending',
    })

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' })
    }

    friendRequest.status = 'accepted'
    await friendRequest.save()

    // Thông báo qua socket
    getIO().to(sender).emit('friendRequestAccepted', {
      sender,
      receiver,
      status: 'accepted',
    })

    res.status(200).json(friendRequest)
  } catch (err) {
    console.error('Error accepting friend request:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Từ chối yêu cầu kết bạn
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { sender, receiver } = req.body

    const friendRequest = await Friend.findOne({
      sender,
      receiver,
      status: 'pending',
    })

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' })
    }

    friendRequest.status = 'rejected'
    await friendRequest.save()

    // Thông báo qua socket
    getIO().to(sender).emit('friendRequestRejected', {
      sender,
      receiver,
      status: 'rejected',
    })

    res.status(200).json(friendRequest)
  } catch (err) {
    console.error('Error rejecting friend request:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Lấy danh sách bạn bè
exports.getFriends = async (req, res) => {
  try {
    const { username } = req.query

    const friends = await Friend.find({
      $or: [
        { sender: username, status: 'accepted' },
        { receiver: username, status: 'accepted' },
      ],
    })

    // Chuyển đổi kết quả để lấy danh sách bạn bè
    const friendList = friends.map((friend) => {
      return friend.sender === username ? friend.receiver : friend.sender
    })

    res.json({ friends: friendList })
  } catch (err) {
    console.error('Error getting friends:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Lấy danh sách yêu cầu kết bạn đang chờ
exports.getPendingRequests = async (req, res) => {
  try {
    const { username } = req.query

    const pendingRequests = await Friend.find({
      receiver: username,
      status: 'pending',
    })

    res.json({ pendingRequests })
  } catch (err) {
    console.error('Error getting pending requests:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
