"use client";
import React from 'react';
import { Search, Plus, MoreHorizontal, Edit, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Kanban: React.FC = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Board Toolbar */}
      <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background border-b border-border flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">API Migration v2.0</h1>
          <div className="flex -space-x-2">
            <Avatar className="w-8 h-8 border-2 border-background">
              <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwjvdjyxonRGCeY18yJCrjl1MybgZ1dbGbGmJqg6pdEVxYGRxX-zxcjVQJN4Y2SEEpSoKEcPH0-F9KESLA4vv0aV4l2o-l12xOk-D7CHcpe-FtmxJ-hSvO4npva0ppWqYPiX5XrFdU85gNBUe-bxCriN8opNJsfXcmn___AVaPr1DVp9SqCtEnPzMfyZGP-D4sGx9i99KBtsB8GxC3w1Qe6KnYOZkLFgTrMrHQ6EPqnw0mlsZs83BxeuwIqLhCoPzmESbL_mRxLgg" />
              <AvatarFallback>TM</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8 border-2 border-background">
              <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuBox8PLDirWipNj-SQthTX1duR1XciUJEtYLsQzhLJO6RJqijrN8TqBDipi2eRrFDFTGspNq8YWmYedPI_ttvz-68SAtcUhGggn8SbKi5vfR-kYLw29w54iUOheQ-BKnTFGQl5GsUko0LU9jagRoHLsgqM1khQ9i-AhTC2Ofs_uUlUqWsr8BDS9tBJaaGU7j2cWeOKMNltv_zZbX9tXr3Ms5K4GRSqDhgI65nt8FHDRvbtHIHY03Dy0dNIHkuZ9GI8ghSJ4un9agQc" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="w-8 h-8 rounded-full border-2 border-background bg-secondary text-xs font-medium flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors">
              +3
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-9 w-full sm:w-64" 
              placeholder="Search tasks..." 
            />
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Kanban Columns Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6 pt-6">
        <div className="flex h-full gap-6 min-w-[1000px]">
          
          {/* Column: To Do */}
          <div className="flex-1 flex flex-col min-w-[320px] max-w-md bg-secondary/50 rounded-xl border border-border">
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <h3 className="font-semibold text-foreground">To Do</h3>
                <Badge variant="secondary" className="px-2 py-0.5 rounded-full font-medium">4</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {/* Card 1 */}
              <Card className="group cursor-grab active:cursor-grabbing hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-indigo-600 bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20">Backend</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <h4 className="text-sm font-medium mb-3 leading-snug">Design Database Schema for User Roles</h4>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                         <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTf23aas65eS3zfJFtiK64bpgpdEcc08PmAFhdio1JOUXsuK0l9VnVOeCGxq7Kg-6Bzh8s93OY-szI8G_YPPamEtlmQ73QH88P1JC1qY78dxBniU9Ft3pWSH-yX-Qmmms_c3AyqQMvDd6uHaseH-0aFLW4UWENV8NjC-0iSkimuTG_ass1GFxHZvcarflIUmROnyUVvdL4upd05sep-wJv6-amWN0mzLDZTbUY3KdSgm_0wZmwEdlNS7-Tz_1vuuLsXKZmUd7xogc" />
                         <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">#TP-102</span>
                    </div>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full hover:bg-primary hover:text-primary-foreground transition-all">
                      <Play className="h-4 w-4 ml-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 */}
               <Card className="group cursor-grab active:cursor-grabbing hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-rose-600 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20">Bug</Badge>
                  </div>
                  <h4 className="text-sm font-medium mb-3 leading-snug">Fix login timeout issue on Safari</h4>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhIKdeuBP5XX67zlFAhsXGtpSMP8n9kuISUnBnNatis8Rz7w-H3Whs0GAyPxr4NLmenr8ZFJ3tARJ982FUYT6aAHkekVUwtPQCzKGEkHXfpx0wOvu19YkrpROskf2fFkCiCtpA2zUg_P9LX-R4ySWhsN6ZtaHSKDfOuI2Lnf3N9aTcBa_PC1re-6qtiU9vtmrJZEUzy4HRKC1mhJUwG9chDPJ3t566SVVi0seMao06TebvVDQrml81OwxElzTB7bMIDB3R68_xync" />
                        <AvatarFallback>B</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">#TP-98</span>
                    </div>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full hover:bg-primary hover:text-primary-foreground transition-all">
                      <Play className="h-4 w-4 ml-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Card 3 */}
               <Card className="group cursor-grab active:cursor-grabbing hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                     <Badge variant="outline" className="text-teal-600 bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 border-teal-200 dark:border-teal-500/20">DevOps</Badge>
                  </div>
                  <h4 className="text-sm font-medium mb-3 leading-snug">Setup CI/CD pipeline for staging</h4>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">UN</div>
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    </div>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full hover:bg-primary hover:text-primary-foreground transition-all">
                      <Play className="h-4 w-4 ml-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
          
           {/* Column: In Progress */}
          <div className="flex-1 flex flex-col min-w-[320px] max-w-md bg-secondary/50 rounded-xl border border-border">
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <h3 className="font-semibold text-foreground">In Progress</h3>
                <Badge variant="secondary" className="px-2 py-0.5 rounded-full font-medium">2</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {/* Empty State or Tasks */}
                 <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground text-sm">
                    Drag tasks here to start
                 </div>
             </div>
          </div>

           {/* Column: Done */}
          <div className="flex-1 flex flex-col min-w-[320px] max-w-md bg-secondary/50 rounded-xl border border-border">
             <div className="p-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <h3 className="font-semibold text-foreground">Done</h3>
                <Badge variant="secondary" className="px-2 py-0.5 rounded-full font-medium">12</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Kanban;
