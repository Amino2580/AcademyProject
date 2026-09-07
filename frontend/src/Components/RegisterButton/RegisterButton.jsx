import "./RegisterButton.css";

function RegisterButton({ onClick }) {
  return (
    <button className="register-button" onClick={onClick}>
      ثبت نام
    </button>
  );
}

export default RegisterButton;