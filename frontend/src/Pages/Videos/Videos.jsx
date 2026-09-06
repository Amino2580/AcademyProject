import "./Videos.css";

import video1 from "../../assets/video1.mp4";
import video2 from "../../assets/video2.mp4";

function Videos() {
return ( <main className="videos-page">

```
  <section className="videos-container">

    <div className="videos-heading">

      <span>
        موسیقی و اجرا
      </span>

      <h1>
        ویدئوهای استاد
      </h1>

      <div className="videos-line"></div>

      <p>
        بخشی از اجراها و فعالیت‌های موسیقی
        میلاد طریقت را در اینجا ببینید.
      </p>

    </div>


    <div className="videos-grid">

      <div className="video-card">

        <div className="video-wrapper">

          <video
            controls
            preload="metadata"
          >
            <source
              src={video1}
              type="video/mp4"
            />

            مرورگر شما از پخش ویدئو پشتیبانی نمی‌کند.
          </video>

        </div>

        <h3>
          اجرای پیانو - شهناز
        </h3>

        <span>
          Milad Tariqat
        </span>

      </div>


      <div className="video-card">

        <div className="video-wrapper">

          <video
            controls
            preload="metadata"
          >
            <source
              src={video2}
              type="video/mp4"
            />

            مرورگر شما از پخش ویدئو پشتیبانی نمی‌کند.
          </video>

        </div>

        <h3>
          اجرای پیانو - تنهایی
        </h3>

        <span>
          Milad Tariqat
        </span>

      </div>

    </div>


    <section className="more-videos">

      <div className="more-icon">
        ♪
      </div>

      <h2>
        ویدئوهای بیشتری می‌خواهید؟
      </h2>

      <p>
        برای مشاهده اجراها و ویدئوهای بیشتر
        استاد، کانال‌های رسمی ما را دنبال کنید.
      </p>


      <div className="video-links">

        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="video-link aparat"
        >
          <span>
            ▶
          </span>

          مشاهده در آپارات
        </a>


        <a
          href="www.aparat.com/search/%D9%85%DB%8C%D9%84%D8%A7%D8%AF%20%D8%B7%D8%B1%DB%8C%D9%82%D8%AA"
          target="_blank"
          rel="noopener noreferrer"
          className="video-link youtube"
        >
          <span>
            ▶
          </span>

          مشاهده در یوتیوب
        </a>

      </div>

    </section>

  </section>

</main>


);
}

export default Videos;
