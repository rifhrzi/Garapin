import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  Shield,
  Users,
  ArrowRight,
  Code,
  Smartphone,
  Palette,
  PenTool,
  FileText,
  Languages,
  Video,
  Megaphone,
  GraduationCap,
  Gamepad2,
  Cloud,
  MoreHorizontal,
  ClipboardList,
  Search,
  CreditCard,
  Star,
  Trophy,
  Award,
  Crown,
  Gem,
  CheckCircle,
} from "lucide-react";

const categories = [
  {
    name: "Web Development",
    slug: "web-development",
    icon: Code,
    minPrice: "Rp100.000",
  },
  {
    name: "Mobile Development",
    slug: "mobile-development",
    icon: Smartphone,
    minPrice: "Rp150.000",
  },
  {
    name: "UI/UX Design",
    slug: "ui-ux-design",
    icon: Palette,
    minPrice: "Rp75.000",
  },
  {
    name: "Graphic Design",
    slug: "graphic-design",
    icon: PenTool,
    minPrice: "Rp50.000",
  },
  {
    name: "Data Entry",
    slug: "data-entry",
    icon: ClipboardList,
    minPrice: "Rp25.000",
  },
  {
    name: "Content Writing",
    slug: "content-writing",
    icon: FileText,
    minPrice: "Rp30.000",
  },
  {
    name: "Translation",
    slug: "translation",
    icon: Languages,
    minPrice: "Rp30.000",
  },
  {
    name: "Video Editing",
    slug: "video-editing",
    icon: Video,
    minPrice: "Rp75.000",
  },
  {
    name: "Digital Marketing",
    slug: "digital-marketing",
    icon: Megaphone,
    minPrice: "Rp50.000",
  },
  {
    name: "Academic / Tugas",
    slug: "academic-tugas",
    icon: GraduationCap,
    minPrice: "Rp25.000",
  },
  {
    name: "Game Development",
    slug: "game-development",
    icon: Gamepad2,
    minPrice: "Rp200.000",
  },
  {
    name: "DevOps & Cloud",
    slug: "devops-cloud",
    icon: Cloud,
    minPrice: "Rp150.000",
  },
  { name: "Other", slug: "other", icon: MoreHorizontal, minPrice: "Rp20.000" },
];

const tiers = [
  {
    name: "Bronze Crafter",
    icon: Award,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    desc: "Starting tier for new freelancers",
    req: "Default",
  },
  {
    name: "Silver Builder",
    icon: Star,
    color: "text-slate-600 bg-slate-50 border-slate-200",
    desc: "5+ projects, 4.0+ rating",
    req: "80%+ completion rate",
  },
  {
    name: "Gold Specialist",
    icon: Trophy,
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    desc: "15+ projects, 4.3+ rating",
    req: "85%+ completion, <10% disputes",
  },
  {
    name: "Platinum Master",
    icon: Crown,
    color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    desc: "30+ projects, 4.5+ rating",
    req: "90%+ completion, <5% disputes",
  },
  {
    name: "Legend Partner",
    icon: Gem,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    desc: "50+ projects, 4.7+ rating",
    req: "95%+ completion, <3% disputes",
  },
];

const steps = [
  {
    step: 1,
    title: "Post Your Project",
    desc: "Describe your project, set your budget range, and choose a deadline. It only takes a few minutes.",
    icon: ClipboardList,
  },
  {
    step: 2,
    title: "Get Bids from Freelancers",
    desc: "Qualified freelancers will submit proposals. Compare their tier, rating, and portfolio before selecting.",
    icon: Search,
  },
  {
    step: 3,
    title: "Work with Escrow Protection",
    desc: "Payment is held securely in escrow. Funds are released only when you approve the delivered work.",
    icon: CreditCard,
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
              Platform Freelance Indonesia
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Temukan Freelancer{" "}
              <span className="text-primary">Terpercaya</span> untuk Project
              Anda
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Platform marketplace freelance Indonesia dengan sistem escrow,
              tier profesional, dan ribuan freelancer berkualitas. Aman,
              transparan, dan terpercaya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="/projects">Browse Projects</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold">1,000+</p>
              <p className="text-sm text-muted-foreground mt-1">Freelancers</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">5,000+</p>
              <p className="text-sm text-muted-foreground mt-1">
                Projects Completed
              </p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">Rp2M+</p>
              <p className="text-sm text-muted-foreground mt-1">
                Total Paid Out
              </p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">4.8</p>
              <p className="text-sm text-muted-foreground mt-1">
                Average Rating
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Browse by Category</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find the right freelancer for any type of project across 13
            professional categories.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/projects?search=${cat.name}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
                <CardContent className="flex flex-col items-center text-center p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <cat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm mb-1">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    From {cat.minPrice}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Separator />

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three simple steps to get your project done safely and
            professionally.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <s.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-3">
                {s.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Tier System */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Freelancer Tier System</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Our tier system ensures quality. Higher tiers unlock more bid slots
            and better project visibility.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`border-2 ${tier.color.split(" ")[2]}`}>
              <CardContent className="p-5 text-center">
                <div
                  className={`h-12 w-12 rounded-full ${tier.color.split(" ")[1]} flex items-center justify-center mx-auto mb-3`}>
                  <tier.icon
                    className={`h-6 w-6 ${tier.color.split(" ")[0]}`}
                  />
                </div>
                <h3 className="font-semibold text-sm mb-1">{tier.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {tier.desc}
                </p>
                <p className="text-xs font-medium">{tier.req}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Trust Features */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why Garapin?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Escrow Protection</h3>
              <p className="text-sm text-muted-foreground">
                Your payment is held securely until you are satisfied with the
                work delivered.
              </p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Verified Freelancers</h3>
              <p className="text-sm text-muted-foreground">
                Our tier system ranks freelancers by quality, ensuring you
                always get the best.
              </p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Dispute Resolution</h3>
              <p className="text-sm text-muted-foreground">
                Dedicated admin team to resolve disputes fairly, protecting both
                clients and freelancers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-2">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-2">I Need Work Done</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Post your project and receive competitive bids from qualified
                Indonesian freelancers.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Post projects for free",
                  "Compare freelancer tiers",
                  "Secure escrow payments",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full">
                <Link href="/register?role=client">Register as Client</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-2">I Want to Freelance</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Join our marketplace and start earning by working on projects
                that match your skills.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Browse thousands of projects",
                  "Level up your tier",
                  "Get paid via bank transfer",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" asChild className="w-full">
                <Link href="/register?role=freelancer">
                  Register as Freelancer
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
