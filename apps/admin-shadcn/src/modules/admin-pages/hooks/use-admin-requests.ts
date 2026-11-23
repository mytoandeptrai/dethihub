'use client'
import {
  lib_adminApi_banUser,
  lib_adminApi_clearQuota,
  lib_adminApi_clearSecurityFlag,
  lib_adminApi_deleteUser,
  lib_adminApi_getAiStats,
  lib_adminApi_getQuota,
  lib_adminApi_getStorage,
  lib_adminApi_grantCredits,
  lib_adminApi_listUsers,
  lib_adminApi_setQuota,
  lib_adminApi_setStorage,
  lib_adminApi_unbanUser,
  lib_adminBankApi_hideBankQuestion,
  lib_adminBankApi_listBankOverrides,
  lib_adminBankApi_revertBankQuestion,
  lib_adminBankApi_saveBankQuestion,
  lib_adminBankApi_unhideBankQuestion,
  lib_adminContentApi_deleteContentDoc,
  lib_adminContentApi_deleteContentExam,
  lib_adminContentApi_getContentExam,
  lib_adminContentApi_listContentDocs,
  lib_adminContentApi_listContentExams,
  lib_adminContentApi_listContentFeedback,
  lib_adminContentApi_listContentReports,
  lib_adminContentApi_markContentFeedbackRead,
  lib_adminContentApi_resolveContentReport,
  lib_adminContentApi_setContentExamStatus,
} from '@admin-pages-engine'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import { adminRequest } from './admin-request'
export function useAdminRequests() {
  const client = useQueryClient()
  const { mutateAsync } = useMutation({ mutationFn: (job: () => Promise<unknown>) => job() })
  return useMemo(
    () => ({
      hideBankQuestion: adminRequest(
        client,
        mutateAsync,
        'hideBankQuestion',
        lib_adminBankApi_hideBankQuestion,
      ),
      listBankOverrides: adminRequest(
        client,
        mutateAsync,
        'listBankOverrides',
        lib_adminBankApi_listBankOverrides,
      ),
      revertBankQuestion: adminRequest(
        client,
        mutateAsync,
        'revertBankQuestion',
        lib_adminBankApi_revertBankQuestion,
      ),
      saveBankQuestion: adminRequest(
        client,
        mutateAsync,
        'saveBankQuestion',
        lib_adminBankApi_saveBankQuestion,
      ),
      unhideBankQuestion: adminRequest(
        client,
        mutateAsync,
        'unhideBankQuestion',
        lib_adminBankApi_unhideBankQuestion,
      ),
      deleteContentDoc: adminRequest(
        client,
        mutateAsync,
        'deleteContentDoc',
        lib_adminContentApi_deleteContentDoc,
      ),
      deleteContentExam: adminRequest(
        client,
        mutateAsync,
        'deleteContentExam',
        lib_adminContentApi_deleteContentExam,
      ),
      getContentExam: adminRequest(
        client,
        mutateAsync,
        'getContentExam',
        lib_adminContentApi_getContentExam,
      ),
      listContentDocs: adminRequest(
        client,
        mutateAsync,
        'listContentDocs',
        lib_adminContentApi_listContentDocs,
      ),
      listContentExams: adminRequest(
        client,
        mutateAsync,
        'listContentExams',
        lib_adminContentApi_listContentExams,
      ),
      listContentFeedback: adminRequest(
        client,
        mutateAsync,
        'listContentFeedback',
        lib_adminContentApi_listContentFeedback,
      ),
      listContentReports: adminRequest(
        client,
        mutateAsync,
        'listContentReports',
        lib_adminContentApi_listContentReports,
      ),
      markContentFeedbackRead: adminRequest(
        client,
        mutateAsync,
        'markContentFeedbackRead',
        lib_adminContentApi_markContentFeedbackRead,
      ),
      resolveContentReport: adminRequest(
        client,
        mutateAsync,
        'resolveContentReport',
        lib_adminContentApi_resolveContentReport,
      ),
      setContentExamStatus: adminRequest(
        client,
        mutateAsync,
        'setContentExamStatus',
        lib_adminContentApi_setContentExamStatus,
      ),
      listUsers: adminRequest(client, mutateAsync, 'listUsers', lib_adminApi_listUsers),
      getAiStats: adminRequest(client, mutateAsync, 'getAiStats', lib_adminApi_getAiStats),
      banUser: adminRequest(client, mutateAsync, 'banUser', lib_adminApi_banUser),
      clearQuota: adminRequest(client, mutateAsync, 'clearQuota', lib_adminApi_clearQuota),
      clearSecurityFlag: adminRequest(
        client,
        mutateAsync,
        'clearSecurityFlag',
        lib_adminApi_clearSecurityFlag,
      ),
      deleteUser: adminRequest(client, mutateAsync, 'deleteUser', lib_adminApi_deleteUser),
      getQuota: adminRequest(client, mutateAsync, 'getQuota', lib_adminApi_getQuota),
      getStorage: adminRequest(client, mutateAsync, 'getStorage', lib_adminApi_getStorage),
      setStorage: adminRequest(client, mutateAsync, 'setStorage', lib_adminApi_setStorage),
      grantCredits: adminRequest(client, mutateAsync, 'grantCredits', lib_adminApi_grantCredits),
      setQuota: adminRequest(client, mutateAsync, 'setQuota', lib_adminApi_setQuota),
      unbanUser: adminRequest(client, mutateAsync, 'unbanUser', lib_adminApi_unbanUser),
    }),
    [client, mutateAsync],
  )
}
