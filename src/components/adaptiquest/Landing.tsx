import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Brain, Sparkles, Target, Zap, ArrowRight, BarChart3, ShieldCheck } from 'lucide-react';

interface LandingProps {
  onStart: (topic: string) => void;
}

const TOPICS = [
  { id: 'react', name: 'React & Frontend Architecture', icon: <Zap className="w-5 h-5" />, color: 'bg-primary/10 text-primary' },
  { id: 'ai', name: 'Artificial Intelligence & ML', icon: <Brain className="w-5 h-5" />, color: 'bg-accent/10 text-accent' },
  { id: 'system', name: 'System Design & Scalability', icon: <Target className="w-5 h-5" />, color: 'bg-success/10 text-success' },
  { id: 'data', name: 'Data Structures & Algorithms', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-destructive/10 text-destructive' },
];

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const [selectedTopic, setSelectedTopic] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-success/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-card border border-border shadow-sm text-primary text-sm font-bold space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Next-Gen Adaptive Learning</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-display font-bold text-foreground tracking-tight leading-[1.1]"
            >
              Master Any Subject with{' '}
              <span className="text-gradient-brand">Adaptive AI</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground leading-relaxed"
            >
              Our intelligent assessment engine evolves in real-time, adjusting difficulty based on your performance patterns, response speed, and behavioral signals.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="bg-card p-8 lg:p-12 rounded-[40px] shadow-studio-lg border border-border">
              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-foreground mb-2">Choose your path</h3>
                    <p className="text-muted-foreground">Select a topic to begin your personalized adaptive assessment.</p>
                  </div>

                  <div className="grid gap-4">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic.name)}
                        className={`flex items-center p-4 rounded-2xl border-2 transition-all text-left group ${
                          selectedTopic === topic.name
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/20 hover:bg-muted'
                        }`}
                      >
                        <div className={`p-3 rounded-xl mr-4 transition-colors ${topic.color}`}>
                          {topic.icon}
                        </div>
                        <span className={`font-bold ${selectedTopic === topic.name ? 'text-primary' : 'text-foreground'}`}>
                          {topic.name}
                        </span>
                        {selectedTopic === topic.name && (
                          <div className="ml-auto w-6 h-6 gradient-brand rounded-full flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={!selectedTopic}
                    onClick={() => onStart(selectedTopic)}
                    className={`w-full py-5 rounded-2xl font-display font-bold text-lg transition-all shadow-xl ${
                      selectedTopic
                        ? 'gradient-brand text-primary-foreground hover:opacity-90 shadow-glow'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    Start Assessment
                  </button>
                </div>

                <div className="bg-surface rounded-[32px] p-8 space-y-8">
                  <h4 className="text-lg font-display font-bold text-foreground">How it works</h4>

                  <div className="space-y-6">
                    {[
                      { n: '1', title: 'Baseline Start', desc: 'We begin with foundational questions to establish your current level.' },
                      { n: '2', title: 'Real-time Adaptation', desc: 'The AI adjusts difficulty after every answer, analyzing accuracy and speed.' },
                      { n: '3', title: 'Competency Mapping', desc: 'Get a deep-dive profile of your mastery across specific subtopics.' },
                    ].map((step) => (
                      <div key={step.n} className="flex space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center text-primary font-bold">{step.n}</div>
                        <div>
                          <h5 className="font-bold text-foreground">{step.title}</h5>
                          <p className="text-sm text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center space-x-3 text-muted-foreground text-sm">
                      <ShieldCheck className="w-5 h-5 text-success" />
                      <span>Fair & Transparent Evaluation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
