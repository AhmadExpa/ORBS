import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/lib/ui";
import { siteConfig } from "@/lib/constants/site";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <SectionHeading
        eyebrow="Department Directory"
        title="Reach the right ElevenOrbits team without routing every request through one inbox."
        description="Use the directory below for service-specific questions, sales conversations, billing, support, and operational requests."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General Inbox</CardTitle>
            <CardDescription>Use this if you are not sure which department should own the conversation yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <a className="text-base font-semibold text-sky-700" href={`mailto:${siteConfig.generalEmail}`}>
              {siteConfig.generalEmail}
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Portal Access</CardTitle>
            <CardDescription>Create an account to manage subscriptions, invoices, payments, and tickets.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {siteConfig.departmentContacts.map((department) => (
          <Card key={department.key}>
            <CardHeader>
              <CardTitle>{department.title}</CardTitle>
              <CardDescription>{department.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <a className="text-base font-semibold text-sky-700" href={`mailto:${department.email}`}>
                {department.email}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
