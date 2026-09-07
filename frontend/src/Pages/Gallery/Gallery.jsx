import "./Gallery.css";
import piano1 from "../../assets/piano1.jpg";
import piano2 from "../../assets/piano2.jpg";
import piano3 from "../../assets/piano3.jpg";

function Gallery() {
  const images = [
    {
      id: 1,
      image: piano1,
      title: "آموزش پیانو",
      description:
        "یادگیری اصولی پیانو با تمرکز بر تکنیک و اجرای صحیح.",
    },
    {
      id: 2,
      image: piano2,
      title: "تمرین و پیشرفت",
      description:
        "تمرین منظم، مسیر پیشرفت و رسیدن به اجرای حرفه‌ای.",
    },
    {
      id: 3,
      image: piano3,
      title: "دنیای موسیقی",
      description:
        "موسیقی ترکیبی از احساس، خلاقیت و تجربه است.",
    },
  ];

  return (
    <main className="gallery-page">

      <section className="gallery-header">
        

        <h1>تصاویر</h1>

        <p>
          لحظه‌هایی از آموزش و دنیای موسیقی
        </p>
      </section>

      <section className="gallery-container">
        <div className="gallery-grid">

          {images.map((item) => (
            <article className="gallery-card" key={item.id}>

              <div className="gallery-image">
                <img
                  src={item.image}
                  alt={item.title}
                />
              </div>

              <div className="gallery-content">
                <h2>{item.title}</h2>

                <p>{item.description}</p>
              </div>

            </article>
          ))}

        </div>
      </section>

    </main>
  );
}

export default Gallery;