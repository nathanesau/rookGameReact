import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({ message, onConfirm, onCancel }: ConfirmDialogProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttons}>
          <button className={styles.cancelButton} onClick={onCancel}>
            No, let me reconsider
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            Yes, play this card
          </button>
        </div>
      </div>
    </div>
  );
};
