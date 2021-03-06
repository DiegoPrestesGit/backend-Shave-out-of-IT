import { startOfHour, isBefore, getHours, format } from 'date-fns'
import { injectable, inject } from 'tsyringe'

import AppError from '@shared/errors/AppError'

import Appointment from '@modules/appointments/infra/typeorm/entities/Appointment'
import IAppointmentsRepository from '../repositories/IAppointmentsRepository'
import INotificationsRepository from '@modules/notifications/repositories/INotificationsRepository'
import ICacheProvider from '@shared/container/providers/CacheProvider/models/ICacheProvider'

interface IRequestDTO {
  provider_id: string
  user_id: string
  date: Date
}

@injectable()
class CreateAppointmentService {
  constructor (
    @inject('AppointmentsRepository')
    private appointmentsRepository: IAppointmentsRepository,

    @inject('NotificationsRepository')
    private notificationsRepository: INotificationsRepository,

    @inject('CacheProvider')
    private cacheProvider: ICacheProvider
  ) {}

  public async execute ({ provider_id, user_id, date }: IRequestDTO): Promise<Appointment> {
    const appointmentDate = startOfHour(date)

    const findAppointmentInSameDate = await this.appointmentsRepository.findByDate(appointmentDate, provider_id)

    if (findAppointmentInSameDate) {
      throw new AppError('bad time to cut your hair, mate')
    }

    if (isBefore(appointmentDate, Date.now())) {
      throw new AppError('You cannot create an appointment on a past date')
    }

    if (user_id === provider_id) {
      throw new AppError('You cannot cut your our hair')
    }

    if (getHours(appointmentDate) < 8 || getHours(appointmentDate) > 17) {
      throw new AppError('You can only create appointments between 8h and 17h')
    }

    const appointment = await this.appointmentsRepository.create({
      provider_id,
      user_id,
      date: appointmentDate
    })

    const dateFormated = format(appointmentDate, "dd/MM/yyyy 'às' HH:mm'h'")

    this.notificationsRepository.create({
      recipient_id: provider_id,
      content: `Novo agendamento para dia ${dateFormated}`
    })

    await this.cacheProvider.invalidate(`provider-appointments:${provider_id}:${format(appointmentDate, 'yyyy-M-d')}`)

    return appointment
  }
}

export default CreateAppointmentService
