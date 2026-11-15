import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Truck, 
  MapPin, 
  ArrowRight, 
  Scale, 
  ShieldCheck, 
  CheckCheck
} from 'lucide-react';
import type { Trip } from '../../data/types';

interface TripJourneyTimelineProps {
  trip: Trip;
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
}

export function TripJourneyTimeline({ trip, currentStepIndex, onStepClick }: TripJourneyTimelineProps) {
  const isSand = trip.returnPlan === 'sand_return' || trip.returnSandLoad !== undefined;
  const isDirect = trip.returnPlan === 'direct_return' || trip.directReturnDetails !== undefined;

  // Build the list of stages depending on the return decision
  const stages = [
    {
      id: 1,
      code: '01',
      title: 'Stone Loading',
      location: trip.origin || 'Kadapa',
      detail: `${(trip.stoneLines || []).reduce((s, l) => s + (l.pieces || 0), 0)} pcs stone`,
      icon: Truck
    },
    {
      id: 2,
      code: '02',
      title: 'Kerala Arrival',
      location: trip.unloadingLocation || 'Kerala Site',
      detail: 'Inbound transit',
      icon: MapPin
    },
    {
      id: 3,
      code: '03',
      title: 'Stone Unloading',
      location: 'Buyer Location',
      detail: trip.unloadedPieces !== undefined ? `${trip.unloadedPieces} pcs unloaded` : 'Pending unloading audit',
      icon: CheckCircle2
    },
    {
      id: 4,
      code: '04',
      title: 'Return Decision',
      location: isSand ? 'Sand Return' : isDirect ? 'Direct Return' : 'Kerala / Pending',
      detail: isSand ? 'Load Sand (Mangalore/Kanaya)' : isDirect ? 'Direct Return to Base' : 'Choose return plan',
      icon: ArrowRight
    },
    ...(isSand
      ? [
          {
            id: 5,
            code: '05',
            title: 'Sand Loading',
            location: trip.returnSandLoad?.loadingLocation || 'Mangalore / Kanaya',
            detail: trip.returnSandLoad ? `${trip.returnSandLoad.weightTons} Tons (${trip.returnSandLoad.sandType})` : 'Pending load',
            icon: Scale
          },
          {
            id: 6,
            code: '06',
            title: 'L&T Factory Arrival',
            location: 'L&T Factory',
            detail: 'Return transit',
            icon: MapPin
          },
          {
            id: 7,
            code: '07',
            title: 'Sand Unloading',
            location: 'L&T Factory',
            detail: trip.returnSandUnload
              ? `${trip.returnSandUnload.receivedWeightTons} Tons (${trip.returnSandUnload.weightDifferenceTons > 0 ? `-${trip.returnSandUnload.weightDifferenceTons}T diff` : 'Matched'})`
              : 'Weight diff check',
            icon: Scale
          }
        ]
      : []),
    {
      id: isSand ? 8 : 5,
      code: isSand ? '08' : '05',
      title: 'Return to Base',
      location: 'Kadapa / Base',
      detail: trip.vehicleReturnDetails ? `Arrived ${trip.vehicleReturnDetails.returnDate}` : 'Arrival & Odometer',
      icon: MapPin
    },
    {
      id: isSand ? 9 : 6,
      code: isSand ? '09' : '06',
      title: 'Final Trip Audit',
      location: 'Owner Audit',
      detail: trip.finalAudit ? 'Verified & Audited' : 'P&L & Checklist verification',
      icon: ShieldCheck
    },
    {
      id: isSand ? 10 : 7,
      code: isSand ? '10' : '07',
      title: 'Trip Completed',
      location: 'Closed',
      detail: trip.status === 'completed' ? `Closed on ${trip.completedDate || 'Base Return'}` : 'Final closure',
      icon: CheckCheck
    }
  ];

  return (
    <div className="rounded-2xl border border-ink-700 bg-gradient-to-b from-ink-900 to-ink-950 p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-gold animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gold font-mono">
            Round-Trip Journey Lifecycle
          </h3>
        </div>
        <span className="text-[11px] text-neutral-400 font-mono">
          Stage {currentStepIndex} of {stages.length}
        </span>
      </div>

      {/* Horizontal Scrollable Timeline Bar */}
      <div className="overflow-x-auto pb-3 pt-1 ti-scroll">
        <div className="flex items-center gap-3 min-w-[760px]">
          {stages.map((st, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStepIndex || trip.status === 'completed';
            const isCurrent = stepNum === currentStepIndex && trip.status !== 'completed';

            return (
              <div 
                key={st.code} 
                onClick={() => onStepClick && onStepClick(stepNum)}
                className={`flex-1 min-w-[130px] rounded-xl p-3 border transition-all cursor-pointer relative group ${
                  isCurrent
                    ? 'bg-gold/10 border-gold shadow-[0_0_20px_rgba(245,184,46,0.15)] ring-1 ring-gold/40'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                    : 'bg-ink-900/60 border-ink-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded ${
                    isCurrent
                      ? 'bg-gold text-black'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-ink-800 text-neutral-400'
                  }`}>
                    {st.code}
                  </span>
                  
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4 text-gold animate-spin" style={{ animationDuration: '6s' }} />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-neutral-600" />
                  )}
                </div>

                <div className="text-xs font-bold text-white truncate group-hover:text-gold transition-colors">
                  {st.title}
                </div>
                <div className="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
                  {st.location}
                </div>
                <div className="text-[9px] text-neutral-500 truncate mt-1">
                  {st.detail}
                </div>

                {/* Arrow connector to next step */}
                {idx < stages.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className={`h-3 w-3 ${isCompleted ? 'text-emerald-400' : 'text-neutral-700'}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend Indicator */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-300">Completed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gold ring-2 ring-gold/30 animate-pulse" />
            <span className="text-gold font-semibold">Active Current Stage</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-neutral-600" />
            <span>Upcoming / Pending</span>
          </span>
        </div>

        {trip.status === 'completed' && (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            <CheckCheck className="h-3.5 w-3.5" /> Full Round-Trip Journey Closed & Audited
          </span>
        )}
      </div>
    </div>
  );
}
