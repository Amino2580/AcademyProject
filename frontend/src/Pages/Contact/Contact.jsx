import "./Contact.css";

function Contact() {
const neshanLocation =
"https://neshan.org/maps/places/10513c45a6013c02d61c9a9828c0cd87#c35.785-51.375-18z-0p";

return ( <main className="contact-page">

```
  <section className="contact-container">

    <div className="contact-heading">

      <span>ارتباط با ما</span>

      <h1>
        تماس با ما
      </h1>

      <div className="contact-line"></div>

      <p>
        برای دریافت اطلاعات بیشتر، ثبت‌نام در کلاس‌ها
        و هماهنگی می‌توانید با ما در ارتباط باشید.
      </p>

    </div>


    <div className="contact-content">

      {/* اطلاعات تماس */}

      <div className="contact-info">

        <div className="contact-item">

          <div className="contact-icon">
            📍
          </div>

          <div>
            <span>آدرس</span>

            <p>
              تهران، سعادت‌آباد، بین یعقوبی و ششم،
              پلاک ۳۶
            </p>
          </div>

        </div>


        <div className="contact-item">

          <div className="contact-icon">
            ☎
          </div>

          <div>
            <span>شماره تماس</span>

            <a href="tel:02122091229">
              938389411498+
            </a>
          </div>

        </div>


        <div className="contact-item">

          <div className="contact-icon">
            🎹
          </div>

          <div>
            <span>آموزشگاه</span>

            <p>
              آموزشگاه موسیقی طریقت
            </p>
          </div>

        </div>


        <a
          href={neshanLocation}
          target="_blank"
          rel="noopener noreferrer"
          className="map-button"
        >
          مشاهده لوکیشن و مسیریابی
          <span>↗</span>
        </a>

      </div>


      {/* نقشه */}

      <a
        href={neshanLocation}
        target="_blank"
        rel="noopener noreferrer"
        className="map-card"
      >

        <div className="map-overlay">

          <div className="map-pin">
            📍
          </div>

          <h3>
            آموزشگاه موسیقی طریقت
          </h3>

          <p>
            سعادت‌آباد تهران
          </p>

          <span>
            برای مشاهده روی نقشه کلیک کنید
          </span>

        </div>

      </a>

    </div>

  </section>

</main>


);
}

export default Contact;
