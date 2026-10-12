import Feed from "./components/Feed";
import Suggestions from "./components/Suggestions";

export default function HomePage() {
  return (
    <div className="home-layout">
      <div className="feed-column">
        <Feed />
      </div>
      <Suggestions />
    </div>
  );
}
