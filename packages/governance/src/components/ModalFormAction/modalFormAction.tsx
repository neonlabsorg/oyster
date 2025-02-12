import React, { useState } from 'react';
import { Alert, Button, ButtonProps, Form, Modal, Space, Tooltip, Typography } from 'antd';
import {
  ExplorerLink,
  isSendTransactionError,
  isSignTransactionError,
  isTransactionTimeoutError,
  useWallet
} from '@oyster/common';
import { getTransactionErrorMsg, isWalletNotConnectedError } from '@solana/spl-governance';
import { formDefaults } from '../../tools/forms';
import './style.less';

const { Text } = Typography;

export interface ModalFormActionProps<TResult> {
  label: string;
  formTitle: string;
  formAction: string;
  formPendingAction: string;
  isWalletRequired?: boolean;
  buttonProps?: ButtonProps;
  buttonTooltip?: string;
  onSubmit: (values: any) => Promise<TResult | undefined>;
  onComplete?: (result: TResult) => void;
  onReset?: () => void;
  children?: any;
  initialValues?: any;
}

export interface ActionFormProps<TResult> {
  onFormSubmit: (a: TResult) => void;
  onFormCancel: () => void;
  isModalVisible: boolean;
  onSubmit: (values: any) => Promise<TResult | undefined>;
  onReset?: () => void;
  formTitle: string;
  formAction: string;
  formPendingAction: string;
  children: any;
  initialValues: any;
}

/// ModalFormAction is a control displayed as a Button action which opens a Modal from
/// The ModalForm captures common form use cases: 1) Progress indicator, 2) Close/Cancel state management, 3) Submission errors
/// TODO: add version without TResult
export function ModalFormAction<TResult>(props: ModalFormActionProps<TResult>) {
  const {
    label, formTitle, formAction, formPendingAction, isWalletRequired = true, buttonProps,
    buttonTooltip, onSubmit, onComplete, onReset, children, initialValues
  } = props;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { connected } = useWallet();

  const onFormSubmit = (result: TResult) => {
    setIsModalVisible(false);
    onComplete && onComplete(result);
  };
  const onFormCancel = () => {
    setIsModalVisible(false);
  };

  const triggerButton = <Button
    onClick={() => setIsModalVisible(true)}
    disabled={isWalletRequired && !connected}
    {...buttonProps}
  >
    {label}
  </Button>;

  return (
    <>
      {buttonTooltip ?
        <Tooltip color='orange' placement='left' title={buttonTooltip}>{triggerButton}</Tooltip> :
        triggerButton}
      <ActionForm
        onFormSubmit={onFormSubmit}
        onFormCancel={onFormCancel}
        isModalVisible={isModalVisible}
        onSubmit={onSubmit}
        onReset={onReset}
        formTitle={formTitle}
        formAction={formAction}
        formPendingAction={formPendingAction}
        children={children}
        initialValues={initialValues}
      />
    </>
  );
}

function ActionForm<TResult>(props: ActionFormProps<TResult>) {
  const {
    onFormSubmit, onFormCancel, isModalVisible, onSubmit, onReset, formTitle, formAction,
    formPendingAction, children, initialValues
  } = props;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    message?: string;
    txId?: string;
    recoveryAction: string;
    header?: string;
  } | null>();

  const resetForm = () => {
    form.resetFields();
    onReset && onReset();
    setError(null);
  };

  const closeForm = (reset = true) => {
    onFormCancel();
    setLoading(false);
    setError(null);
    reset && resetForm();
  };

  const onSubmitForm = async (values: any) => {
    try {
      setLoading(true);
      setError(null);

      const result = await onSubmit(values);
      if (result) onFormSubmit(result);
    } catch (ex) {
      console.log('Submit error', ex);

      if (isSendTransactionError(ex)) {
        setError({
          txId: ex.txId,
          message: `${getTransactionErrorMsg(ex).toString()}`,
          recoveryAction: 'Please try to amend the inputs and submit the transaction again'
        });
      } else if (isTransactionTimeoutError(ex)) {
        setError({
          txId: ex.txId,
          message: ex.message,
          recoveryAction: 'Please try to submit the transaction again'
        });
      } else if (isSignTransactionError(ex)) {
        setError({
          header: 'Couldn\'t sign the transaction',
          message: ex.message,
          recoveryAction:
            'Please try to submit and sign the transaction with your wallet again'
        });
      } else if (isWalletNotConnectedError(ex)) {
        setError({
          header: 'Can\'t submit the transaction',
          message: ex.message,
          recoveryAction: 'Please ensure your wallet is connected and submit the transaction again'
        });
      } else {
        setError({
          header: 'Can\'t submit the transaction',
          message: ex.toString(),
          recoveryAction: 'Please try to amend the inputs and submit the transaction again'
        });
      }
    } finally {
      setLoading(false);
      closeForm();
    }
  };

  const ErrorMessageBanner = () => {
    return error ? (
      <div className='error-message-banner'>
        <Alert
          message={
            <>
              {error.txId ? (
                <div>
                  <span>Transaction </span>
                  <ExplorerLink
                    address={error.txId}
                    type='transaction'
                    length={5}
                  />
                  <span> returned an error</span>
                </div>
              ) : (
                error?.header
              )}
            </>
          }
          description={<Space direction='vertical'>
            {error.message && <Text type='warning'>{error.message}</Text>}
            <Text type='secondary'>{error.recoveryAction}</Text>
          </Space>}
          type='error'
          closable
          banner
          onClose={() => setError(null)}
        />
      </div>
    ) : null;
  };

  return (
    <Modal
      title={formTitle}
      visible={isModalVisible}
      onCancel={() => closeForm(false)}
      footer={[
        <Button key='negative' onClick={() => closeForm(!loading)}>
          {loading ? 'Close' : 'Cancel'}
        </Button>,
        <Button key='positive' onClick={form.submit} loading={loading} type='primary'>
          {loading ? `${formPendingAction}...` : formAction}
        </Button>
      ]}
    >
      {error && <ErrorMessageBanner />}

      <Form {...formDefaults} form={form} onFinish={onSubmitForm} initialValues={initialValues}>
        {children}
      </Form>
    </Modal>
  );
}
