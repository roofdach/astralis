import Header from "@/components/Header";
import ClickerLoader from "@/components/clicker/ClickerLoader";

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <h1 className="sr-only">Cookie Clicker</h1>
        <ClickerLoader />
      </main>
    </>
  );
}
