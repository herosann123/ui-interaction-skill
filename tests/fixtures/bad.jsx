export default function Card() {
  return (
    <div className="card" onClick={() => open()}>
      <img src="/cover.png" />
      <input placeholder="邮箱" />
      <a href="https://example.com" target="_blank">more</a>
    </div>
  );
}
