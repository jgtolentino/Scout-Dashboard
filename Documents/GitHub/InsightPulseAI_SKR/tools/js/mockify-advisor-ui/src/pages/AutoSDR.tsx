import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AutoSDR() {
  // Set document title on component mount
  React.useEffect(() => {
    document.title = "Meet Arkie – Your AI SDR | InsightPulseAI";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Arkie is your AI-powered SDR agent for lead qualification, voice outreach, and sales automation. Hear a demo today.');
    }
    
    // Return function to reset title on unmount
    return () => {
      document.title = "Scout Advisor | InsightPulseAI";
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Hero Section */}
      <header className="text-center py-16 px-6 border-b border-slate-800">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-blue-500 text-transparent bg-clip-text">
          Meet Arkie – Your AI-Powered SDR Agent
        </h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
          Arkie initiates conversations, qualifies leads, and syncs to your CRM – all in real time. 
          No fatigue. No missed follow-ups. Just pure outbound firepower.
        </p>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-6">
        {/* Features Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-semibold mb-6 text-teal-400">
              Why Teams Choose Arkie
            </h2>
            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-teal-400">24/7 Outreach</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">
                    Global timezone intelligence for perfect timing across markets with
                    zero SDR burnout or capacity limitations.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-teal-400">Human-Level Voice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">
                    AI conversations so natural your prospects won't know they're speaking 
                    with Arkie until you tell them.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-teal-400">CRM Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">
                    Automatic sync with Salesforce, HubSpot, and more. Complete with 
                    lead scoring, qualification data, and call recordings.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-center">
            <img 
              src="/arkie-avatar.png" 
              alt="Arkie AI SDR Agent" 
              className="w-64 h-64 object-cover rounded-full border-4 border-teal-500 shadow-[0_0_30px_rgba(45,212,191,0.5)]"
            />
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="mb-16 py-10 px-8 bg-slate-900 rounded-xl border border-slate-800">
          <h2 className="text-3xl font-semibold mb-8 text-center text-teal-400">
            How Arkie Performs
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl">93%</CardTitle>
                <CardDescription className="text-slate-400">
                  Natural conversation rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Prospects engage with Arkie at nearly the same rate as human SDRs.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl">48%</CardTitle>
                <CardDescription className="text-slate-400">
                  More qualified opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Teams using Arkie see a significant increase in qualified leads.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl">5.2X</CardTitle>
                <CardDescription className="text-slate-400">
                  Outreach capacity multiplier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Expand your team's outreach without adding headcount.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-16 px-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl">
          <h2 className="text-3xl font-semibold mb-4">
            Hear Arkie In Your Brand Voice
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8">
            Want to test Arkie on your own leads or hear what it sounds like with your script?
            We'll generate a live sample in less than 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-teal-500 hover:bg-teal-400 text-white px-8 py-6 text-lg h-auto"
              onClick={() => window.location.href = "mailto:business@insightpulseai.com"}
            >
              Request Voice Demo
            </Button>
            <Button 
              variant="outline" 
              className="border-teal-500 text-teal-400 hover:bg-teal-950 px-8 py-6 text-lg h-auto"
              onClick={() => window.open("https://calendly.com/insightpulseai/demo", "_blank")}
            >
              Schedule Call
            </Button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-slate-800 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} InsightPulseAI. All rights reserved.</p>
      </footer>
    </div>
  );
}