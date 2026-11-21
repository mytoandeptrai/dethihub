import { Module } from '@nestjs/common'

import { UserDeletionListener } from '@/modules/bank/application/listeners/user-deletion.listener'
import { BANK_QUESTION_REPOSITORY } from '@/modules/bank/application/ports/bank-question.repository.port'
import { USER_DATA_REPOSITORY } from '@/modules/bank/application/ports/user-data.repository.port'
import { BankService } from '@/modules/bank/application/services/bank.service'
import { BankQuestionRepositoryImpl } from '@/modules/bank/infrastructure/repositories/bank-question.repository'
import { UserDataRepositoryImpl } from '@/modules/bank/infrastructure/repositories/user-data.repository'
import { AdminBankController } from '@/modules/bank/presentation/controllers/admin-bank.controller'
import { BankController } from '@/modules/bank/presentation/controllers/bank.controller'

@Module({
  controllers: [BankController, AdminBankController],
  providers: [
    BankService,
    UserDeletionListener,
    { provide: BANK_QUESTION_REPOSITORY, useClass: BankQuestionRepositoryImpl },
    { provide: USER_DATA_REPOSITORY, useClass: UserDataRepositoryImpl },
  ],
})
export class BankModule {}
