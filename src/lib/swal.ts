import Swal from "sweetalert2";

/** Clarivana-themed SweetAlert. Behaviour is unchanged; only styling differs. */
export const CSwal = Swal.mixin({
  customClass: { popup: "clarivana-modal" },
  buttonsStyling: false,
});

export default CSwal;
