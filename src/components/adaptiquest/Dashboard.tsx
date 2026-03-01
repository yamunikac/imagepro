import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  Trophy, Target, Zap, BookOpen, ChevronRight,
  TrendingUp, AlertCircle, CheckCircle2, Award, Sparkles,
} from 'lucide-react';
import { CompetencyProfile, Difficulty } from '@/types/assessment';

interface DashboardProps {
  profile: CompetencyProfile;
  onRestart: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, onRestart }) => {
  const radarData = useMemo(() => {
    return profile.topicMastery.map((tm) => ({
      subject: tm.subtopic,
      score: tm.score,
      fullMark: 100,
    }));
  }, [profile]);

  const getLevelColor = (level: Difficulty) => {
    switch (level) {
      case Difficulty.ADVANCED: return 'text-primary bg-primary/10 border-primary/20';
      case Difficulty.INTERMEDIATE: return 'text-warning bg-warning/10 border-warning/20';
      case Difficulty.BEGINNER: return 'text-success bg-success/10 border-success/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-primary font-bold uppercase tracking-widest text-xs">
            <Award className="w-4 h-4" />
            <span>Assessment Complete</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">Your Competency Profile</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Based on your performance patterns, response efficiency, and adaptive progression.
          </p>
        </div>
        <button onClick={onRestart} className="px-6 py-3 bg-card border-2 border-border text-muted-foreground font-bold rounded-xl hover:bg-muted transition-colors">
          Take Another Test
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Trophy className="w-8 h-8 text-primary" />, bg: 'bg-primary/10', label: 'Overall Proficiency', value: profile.overallLevel },
          {
            icon: <Target className="w-8 h-8 text-success" />, bg: 'bg-success/10', label: 'Average Accuracy',
            value: `${Math.round(profile.topicMastery.reduce((acc, tm) => acc + tm.accuracy, 0) / (profile.topicMastery.length || 1))}%`,
          },
          {
            icon: <Zap className="w-8 h-8 text-warning" />, bg: 'bg-warning/10', label: 'Response Efficiency',
            value: `${(profile.topicMastery.reduce((acc, tm) => acc + tm.averageResponseTime, 0) / (profile.topicMastery.length || 1) / 1000).toFixed(1)}s`,
          },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-card p-8 rounded-3xl border border-border shadow-studio-lg flex flex-col items-center text-center space-y-4"
          >
            <div className={`w-16 h-16 ${stat.bg} rounded-2xl flex items-center justify-center`}>{stat.icon}</div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-display font-bold text-foreground mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Radar Chart */}
          <div className="bg-card p-8 rounded-3xl border border-border shadow-studio-lg">
            <h3 className="text-xl font-display font-bold text-foreground mb-8 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Subtopic Mastery Radar
            </h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Radar name="Mastery Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Topic Breakdown */}
          <div className="bg-card p-8 rounded-3xl border border-border shadow-studio-lg">
            <h3 className="text-xl font-display font-bold text-foreground mb-8 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-primary" />
              Detailed Topic Breakdown
            </h3>
            <div className="space-y-6">
              {profile.topicMastery.map((tm, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="font-bold text-foreground">{tm.subtopic}</h4>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">{tm.topic}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getLevelColor(tm.level)}`}>{tm.level}</div>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${tm.score}%` }} className="h-full gradient-brand rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Accuracy: {tm.accuracy}%</span>
                    <span>Avg Time: {(tm.averageResponseTime / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-foreground text-background p-8 rounded-3xl shadow-studio-lg">
            <h3 className="text-xl font-display font-bold mb-6 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              AI Insights
            </h3>
            <p className="text-background/70 leading-relaxed text-sm mb-8 italic">"{profile.summary}"</p>

            <div className="space-y-6">
              <div>
                <h4 className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Key Strengths</h4>
                <div className="space-y-2">
                  {profile.strengths.map((s, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-background/80">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-destructive text-xs font-bold uppercase tracking-widest mb-3">Growth Areas</h4>
                <div className="space-y-2">
                  {profile.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-background/80">{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card p-8 rounded-3xl border border-border shadow-studio-lg">
            <h3 className="text-xl font-display font-bold text-foreground mb-6">Next Steps</h3>
            <div className="space-y-4">
              {profile.recommendations.map((rec, i) => (
                <div key={i} className="group p-4 bg-muted rounded-2xl border border-border hover:border-primary/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground leading-snug pr-4">{rec}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
