import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "InstaLite",
  description: "Instagram-style photo and short video sharing platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="main-area">
          <div className="content-wrap">{children}</div>
        </div>
      </body>
    </html>
  );
}
