import path from 'path'
import fs from 'fs'
import { injectable, inject } from 'tsyringe'

import AppError from '@shared/errors/AppError'
import uploadConfig from '@config/upload'

import User from '@modules/users/infra/typeorm/entities/User'
import IUsersRepository from '@modules/users/repositories/IUsersRepository'

interface IRequestDTO {
  user_id: string,
  avatarFileName: string
}

@injectable()
class UpdateUserAvatarService {
  constructor (
    @inject('UserRepository')
    private usersRepository: IUsersRepository) { }

  public async execute ({ user_id, avatarFileName }: IRequestDTO): Promise<User> {
    const user = await this.usersRepository.findById(user_id)

    if (!user) {
      throw new AppError('Only authenticated users can change avatars', 401)
    }

    if (user.avatar) {
      const userAvatarFilePath = path.join(uploadConfig.diretory, user.avatar)
      const userAvatarFileExists = await fs.promises.stat(userAvatarFilePath)

      if (userAvatarFileExists) {
        await fs.promises.unlink(userAvatarFilePath)
      }
    }

    user.avatar = avatarFileName
    await this.usersRepository.save(user)

    return user
  }
}

export default UpdateUserAvatarService