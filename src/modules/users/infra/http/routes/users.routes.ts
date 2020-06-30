import { Router } from 'express'
import { container } from 'tsyringe'

import CreateUserService from '@modules/users/services/CreateUserService'
import ensureAuthenticaded from '@modules/users/infra/http/middlewares/ensureAuthenticated'
import multer from 'multer'
import uploadConfig from '@config/upload'
import UpdateUserAvatarService from '@modules/users/services/UpdateUserAvatarService'

const usersRouter = Router()
const upload = multer(uploadConfig)

usersRouter.post('/', async (request, response) => {
  const { name, email, password } = request.body

  const createUser = container.resolve(CreateUserService)
  const user = await createUser.execute({ name, email, password })

  delete user.password

  return response.json(user)
})

usersRouter.patch('/avatar', ensureAuthenticaded, upload.single('avatar'), async (request, response) => {
  const updateUserAvatar = container.resolve(UpdateUserAvatarService)

  const user = await updateUserAvatar.execute({
    user_id: request.user.id,
    avatarFileName: request.file.filename
  })

  delete user.password

  return response.json(user)
})

export default usersRouter