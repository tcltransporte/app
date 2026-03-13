import Swal from 'sweetalert2';

const premiumSwal = Swal.mixin({
  customClass: {
    confirmButton: 'swal2-confirm-custom',
    cancelButton: 'swal2-cancel-custom',
    popup: 'swal2-modal-custom',
  },
  buttonsStyling: false,
});

/**
 * Custom alert utility using SweetAlert2
 */
export const alert = {
  /**
   * Confirmation dialog
   */
  confirm: async (title, text, icon = 'warning') => {
    const result = await premiumSwal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    return result.isConfirmed;
  },

  /**
   * Success notification (toast)
   */
  success: (title) => {
    premiumSwal.fire({
      icon: 'success',
      title,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'swal2-toast-custom',
        title: 'swal2-toast-title-custom', // Added for extra safety if needed
      }
    });
  },

  /**
   * Error notification
   */
  error: (title, text) => {
    premiumSwal.fire({
      icon: 'error',
      title,
      text,
    });
  },
};
