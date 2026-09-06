import "./About.css";
import miladImage from "../../assets/pic1.webp";

function About() {
return ( <main className="about-page">

```
  <section className="about-hero">

    {/* عکس استاد */}

    <div className="about-image-wrapper">

      <div className="about-image-glow"></div>

      <img
        src={miladImage}
        alt="میلاد طریقت"
        className="about-image"
      />

      <div className="image-frame"></div>

    </div>


    {/* متن */}

    <div className="about-content">

      <span className="about-label">
        درباره استاد
      </span>

      <h1>
        میلاد طریقت
      </h1>

      <div className="about-line"></div>

      <h2>
        موسیقی، جایی برای بیان احساسات
      </h2>

      <p>
        موسیقی برای من تنها مجموعه‌ای از نت‌ها نیست؛
        بلکه زبانی برای بیان احساس، تجربه و ارتباط
        با دیگران است.
      </p>

      <p>
        متولد پنجم مرداد ۱۳۶۸ فارغ التحصیل دکتری تخصصی رشته مهندسی نرم‌افزار، مدرس پیانو ایرانی و کلاسیک و مدرس دانشگاه.
ساز پیانو را از سال ۱۳۷۲ نزد اساتیدی چون حسین خضرلو زاده، جواد عبداللهی، سروش ده بستی، سامان احتشامی و دکتر مهران روحانی شروع کرد. از جمله فعالیت‌های وی می‌توان به اجرای کنسرت به همراه گروه طریقت در تالار آوینی، سفارت یونان، فرهنگ سرای ارسباران، جزیره کیش، همراهی گروه طریقت در کشور ایتالیا و فستیوال‌های بین المللی، تالار رودکی به همراه ارکستر بزرگ داتا، تالار حوزه هنری به همراه گروه دانوش، کنسرت پرفورمنس حبس دنیا گروه طریقت، تالار وحدت و همچنین برگزاری کنسرت هنرجویی مستقل گروه پیانو در فرهنگسرای نیاوران ، ارسباران، جزیره کیش و سالن ابن سینا (شهرک غرب) اشاره کرد.

میلاد طریقت علاوه بر ساز پیانو بر سازهای ضربی نیز تسلط دارد که حاصل فعالیت وی با گروه طریقت نوازندگی در آلبوم‌های جام الست و سرآغاز است.

      </p>


      {/* اطلاعات */}

      <div className="about-info">

        <div className="info-item">
          <span>تخصص</span>
          <strong>پیانو و موسیقی</strong>
        </div>

        <div className="info-item">
          <span>فعالیت</span>
          <strong>آموزش موسیقی</strong>
        </div>

        <div className="info-item">
          <span>سبک</span>
          <strong>کلاسیک و مدرن</strong>
        </div>

      </div>

    </div>

  </section>


  {/* بخش پایین */}

  <section className="about-quote">

    <span className="quote-mark">“</span>

    <p>
      هر نت، شروع یک داستان است؛
      کافیست آن را درست بشنویم.
    </p>

    <span className="quote-author">
      — میلاد طریقت
    </span>

  </section>

</main>

);
}

export default About;
