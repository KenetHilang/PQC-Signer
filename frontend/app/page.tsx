import HeroPage from '@/components/heroPage';
import NavBar from '@/components/ui/navbar/navBar';

const items = [
  "Service",
  "Upload",
  "About"
]

export default function HomePage() {
  return (
    <> 
      <NavBar items={items}/>
      <HeroPage />
    </>
  );
}
