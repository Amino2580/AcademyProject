import "./SideMenu.css";

import insta from "../../assets/insta.png";
import youtube from "../../assets/youtube.svg";
import telegram from "../../assets/telegram.png";
import phone from "../../assets/phone.svg";

function SideMenu() {
  return (
    <div className="social-links">

      <a
        href="https://milad.tarighat"
        target="_blank"
        rel="noreferrer"
      >
        <img src={insta} alt="Instagram" className="instagram" />
        <span>Instagram</span>
      </a>

      <a
        href="https://youtube.com/"
        target="_blank"
        rel="noreferrer"
      >
        <img src={youtube} alt="Youtube" className="youtube" />
        <span>Youtube</span>
      </a>

      <a
        href="https://telegram.me/milad_tarighat"
        target="_blank"
        rel="noreferrer"
      >
        <img src={telegram} alt="Telegram" className="telegram" />
        <span>Telegram</span>
      </a>

      <a href="tel:+989383894114">
        <img src={phone} alt="Call" className="phone" />
        <span>Call</span>
      </a>

    </div>
  );
}

export default SideMenu;