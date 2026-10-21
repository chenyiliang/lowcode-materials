import * as React from 'react';
import { useRef, useImperativeHandle, useEffect, useState, forwardRef } from 'react';
import { Step, Box } from '@alifd/next';
import { StepProps, ItemProps } from '@alifd/next/lib/step';
import Operations from '@/common/operations';

export interface StepFormProps extends StepProps {
  children?: React.ReactElement | React.ReactElement[];
  onPrevious?: Function;
  onNext?: Function;
  formRef?: React.MutableRefObject<any | undefined>;
  formMapRef?: React.MutableRefObject<any | undefined>;
  operations?: any[];
  operationConfig?: Record<string, any>;
  lastSaveTime?: Number;
  /**
   * 垂直方向下是否同时展示所有步骤的表单（而非只展示当前步）。
   * 原先未声明在 props 类型里，导致 `props.showAll` 取值报 TS2339。
   */
  showAll?: boolean;
}
export interface StepFormItemProps extends ItemProps {
  stepItemProps?: React.ReactNode;
}

type StepAction = (step: number, setStep: (value: number) => void, stepLength: number) => void;

const ACTION_MAP: Record<'previous' | 'next', StepAction> = {
  previous: (step, setStep) => {
    setStep(Math.max(0, --step));
  },
  next: (step, setStep, stepLength) => {
    setStep(Math.min(stepLength - 1, ++step));
  },
};

const noop: StepAction = () => {};

function getAction(action: string | number): StepAction {
  return (ACTION_MAP as Record<string | number, StepAction>)[action] || noop;
}

/**
 * React 19 适配：React 19 中 `ref` 变成普通 prop，`child.ref` 不再是稳定入口，
 * 父级传入的 ref 现在挂在 `child.props.ref` 上。这里用 cloneElement 注入 callback ref，
 * 既写回 formArrayRef，又转发父级原始 ref，保持原行为。
 */
function makeMergedRef(
  child: React.ReactElement,
  index: number,
  formArrayRef: React.MutableRefObject<Array<React.MutableRefObject<any>>>,
) {
  const originalRef = (child.props as { ref?: React.Ref<unknown> }).ref;
  return (node: unknown) => {
    // Keep your own reference
    (formArrayRef.current as unknown[])[index] = node as React.MutableRefObject<any>;
    // Call the original ref, if any
    if (typeof originalRef === 'function') {
      originalRef(node);
    } else if (originalRef && typeof originalRef === 'object') {
      (originalRef as React.MutableRefObject<unknown>).current = node;
    }
  };
}

function renderStep(
  props: StepFormProps,
  formArray: Map<string, StepFormItemProps>,
  step: number,
  formArrayRef: React.MutableRefObject<Array<React.MutableRefObject<any>>>,
) {
  const { direction = 'hoz', children, showAll, ...others } = props;
  if (direction === 'hoz') {
    return (
      <div className="fusion-ui-step-form steps">
        {formArray && (
          <Step direction={direction} {...others} current={step}>
            {Array.from(formArray.keys()).map((item) => {
              const { stepItemProps } = formArray.get(item) || {};
              return <Step.Item key={item} {...(stepItemProps as object)} />;
            })}
          </Step>
        )}
      </div>
    );
  }
  return (
    <div className="fusion-ui-step-form steps">
      <Step direction={direction} {...others} current={step}>
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return null;
          const { stepItemProps } = formArray.get(`${index}`) || {};
          const content = (
            <div
              className="fusion-ui-step-form forms"
              style={{ display: showAll || step === index ? 'block' : 'none' }}
            >
              {React.cloneElement(child, {
                ref: makeMergedRef(child, index, formArrayRef),
              } as Partial<unknown>)}
            </div>
          );
          return <Step.Item content={content} key={index} {...(stepItemProps as object)} />;
        })}
      </Step>
    </div>
  );
}

function renderForm(
  props: StepFormProps,
  step: number,
  formArrayRef: React.MutableRefObject<Array<React.MutableRefObject<any>>>,
) {
  const { children } = props;
  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null;
        return (
          <div
            className="fusion-ui-step-form forms"
            style={{ display: step === index ? 'block' : 'none' }}
          >
            {React.cloneElement(child, {
              ref: makeMergedRef(child, index, formArrayRef),
            } as Partial<unknown>)}
          </div>
        );
      })}
    </>
  );
}

interface RenderOperationsParams {
  operations?: any[];
  operationConfig?: Record<string, any>;
  lastSaveTime?: Number;
  onPrevious?: Function;
  onNext?: Function;
  step: number;
  setStep: (value: number) => void;
  stepLength: number;
}

const renderOperations = ({
  operations,
  operationConfig = {},
  lastSaveTime,
  onPrevious,
  onNext,
  step,
  setStep,
  stepLength,
}: RenderOperationsParams) => {
  if (!operations || !operations.length) {
    return null;
  }

  const baseOperations = operations.map((operation: any) => {
    let onClick: Function = getAction(operation.action).bind(this, step, setStep, stepLength);
    if (operation.action) {
      if (operation.action === 'next') {
        operation.disabled = step === stepLength - 1;
        if (onNext && typeof onNext === 'function') {
          onClick = onNext;
        }
      } else if (operation.action === 'previous') {
        operation.disabled = step === 0;
        if (onPrevious && typeof onPrevious === 'function') {
          onClick = onPrevious;
        }
      }
    }
    return {
      onClick,
      ...operation,
    };
  });
  const operationsProps = {
    operations: baseOperations,
    operationConfig,
    lastSaveTime,
  };

  return <Operations {...operationsProps} />;
};

function StepForm(props: StepFormProps, ref: React.Ref<HTMLDivElement>) {
  const {
    children,
    onPrevious,
    onNext,
    formRef,
    formMapRef: propsFormMapRef,
    operations,
    operationConfig,
    lastSaveTime,
    direction = 'hoz',
  } = props;

  // props.current 是可选的（StepProps.current?: number），step 内部按 number 使用，缺省为 0
  const [step, setStep] = useState(props.current ?? 0);

  const formArrayRef = useRef<Array<React.MutableRefObject<any | undefined>>>([]);
  useImperativeHandle(propsFormMapRef, () => formArrayRef.current);
  const currentFormRef = formArrayRef.current[step || 0]?.current;
  useImperativeHandle(formRef, () => currentFormRef);
  const formArray = new Map<string, StepFormItemProps>();
  React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return;
    const itemProps = child.props as StepFormItemProps;
    const name = `${index}`;
    formArray.set(name, itemProps);
  });
  useEffect(() => {
    setStep(props.current ?? 0);
  }, [props.current]);

  if (!children) {
    return (
      <Box
        ref={ref as React.Ref<React.ComponentRef<typeof Box>>}
        align="center"
        justify="center"
        style={{ minHeight: 50 }}
      >
        <span>内容为空</span>
      </Box>
    );
  }
  return (
    <div ref={ref}>
      <>{renderStep(props, formArray, step, formArrayRef)}</>
      <>{direction === 'hoz' ? renderForm(props, step, formArrayRef) : null}</>
      {renderOperations({
        operations,
        operationConfig,
        lastSaveTime,
        onPrevious,
        onNext,
        step,
        setStep,
        stepLength: formArray.size,
      })}
    </div>
  );
}

export default forwardRef(StepForm);
