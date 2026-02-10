import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg mb-3">
              <Briefcase className="h-5 w-5 text-primary" />
              Garapin
            </div>
            <p className="text-sm text-muted-foreground">
              Platform freelance Indonesia terpercaya dengan sistem escrow dan
              tier profesional.
            </p>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Untuk Client</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/projects/new"
                  className="hover:text-foreground transition-colors">
                  Post Project
                </Link>
              </li>
              <li>
                <Link
                  href="/projects"
                  className="hover:text-foreground transition-colors">
                  Browse Freelancers
                </Link>
              </li>
            </ul>
          </div>

          {/* For Freelancers */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Untuk Freelancer</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/projects"
                  className="hover:text-foreground transition-colors">
                  Find Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-foreground transition-colors">
                  Join as Freelancer
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/login"
                  className="hover:text-foreground transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-foreground transition-colors">
                  Register
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Garapin. All rights reserved.</p>
          <p>Made with care in Indonesia</p>
        </div>
      </div>
    </footer>
  );
}
