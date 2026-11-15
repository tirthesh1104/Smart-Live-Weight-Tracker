import numpy as np
from typing import List, Dict, Any, Optional
from models import (
    CrowdBalancingRequest, CrowdBalancingResponse, CoachBalancingAdvisory
)

class PlatformCrowdBalancingEngine:
    """
    Dynamic Platform Crowd Balancing & Passenger Migration Advisory:
    1. Analyzes coach crowd distribution across train rake
    2. Measures train rake load imbalance index (standard deviation of occupancy)
    3. Generates targeted passenger diversion directions from crowded to vacant coaches
    4. Formulates bilingual audio PA announcements and Platform LED ticker messages
    """

    @classmethod
    def generate_balancing_plan(cls, req: CrowdBalancingRequest) -> CrowdBalancingResponse:
        coaches = req.coaches
        passenger_coaches = [c for c in coaches if c.coach_type not in ('Engine', 'Pantry Car')]

        if not passenger_coaches:
            return CrowdBalancingResponse(
                train_id=req.train_id,
                train_number=req.train_number,
                platform_no=req.platform_no,
                overall_train_occupancy=0.0,
                imbalance_index=0.0,
                advisories=[],
                audio_chime_announcement="Train composition data currently unavailable.",
                led_display_ticker="WAITING FOR TELEMETRY STREAM"
            )

        occupancies = [c.occupancy_percentage for c in passenger_coaches]
        overall_occ = float(np.mean(occupancies))
        imbalance_index = float(np.std(occupancies))

        # Separate into overloaded/heavy vs available coaches
        heavy_coaches = [c for c in passenger_coaches if c.occupancy_percentage >= 80.0]
        light_coaches = [c for c in passenger_coaches if c.occupancy_percentage < 60.0]
        # Sort available coaches by lowest occupancy
        light_coaches_sorted = sorted(light_coaches, key=lambda c: c.occupancy_percentage)

        advisories: List[CoachBalancingAdvisory] = []
        diversion_announcements: List[str] = []
        diversion_announcements_mr: List[str] = []

        light_idx = 0
        for coach_idx, coach in enumerate(passenger_coaches, start=1):
            occ = coach.occupancy_percentage
            pillar_bay = f"Pillar {coach_idx * 2 - 1}-{coach_idx * 2}"
            
            if occ >= 85.0:
                # Find best migration coach of compatible type or nearest available
                compatible_light = [c for c in light_coaches_sorted if c.coach_type == coach.coach_type]
                target_coach = compatible_light[0] if compatible_light else (light_coaches_sorted[light_idx % len(light_coaches_sorted)] if light_coaches_sorted else None)
                if light_coaches_sorted:
                    light_idx += 1

                excess_pct = occ - 75.0
                pax_divert = max(5, int(round(excess_pct * 0.9)))

                target_no = target_coach.coach_no if target_coach else "Adjacent Coach"
                target_occ = target_coach.occupancy_percentage if target_coach else 40.0

                action_msg = f"Divert passengers towards Coach {target_no} ({target_occ}% occupied)."
                display_msg = f"COACH {coach.coach_no} FULL ({round(occ)}%) -> PLEASE BOARD COACH {target_no} ({round(target_occ)}%) AT {pillar_bay}"
                display_msg_mr = f"डबा {coach.coach_no} गर्दी ({round(occ)}%) -> कृपया डबा {target_no} मध्ये चढा ({pillar_bay})"
                
                advisories.append(CoachBalancingAdvisory(
                    coach_no=coach.coach_no,
                    coach_type=coach.coach_type,
                    current_occupancy=round(occ, 1),
                    status="CRITICAL_CROWD" if occ > 100.0 else "HEAVY_CONGESTION",
                    suggested_action=action_msg,
                    target_migration_coach=target_no,
                    passengers_to_divert=pax_divert,
                    display_board_message=display_msg,
                    pillar_bay=pillar_bay,
                    display_board_message_mr=display_msg_mr
                ))
                diversion_announcements.append(f"Coach {coach.coach_no} is heavily crowded. Commuters are advised to move to Coach {target_no}.")
                diversion_announcements_mr.append(f"डबा {coach.coach_no} मध्ये जास्त गर्दी आहे. प्रवाशांनी डबा {target_no} कडे जावे.")

            elif occ <= 50.0:
                display_msg = f"COACH {coach.coach_no} HAS VACANT SEATS ({round(occ)}% OCCUPIED) -> RECOMMENDED BOARDING ({pillar_bay})"
                display_msg_mr = f"डबा {coach.coach_no} जागा उपलब्ध ({round(occ)}%) -> प्राधान्य द्या ({pillar_bay})"
                advisories.append(CoachBalancingAdvisory(
                    coach_no=coach.coach_no,
                    coach_type=coach.coach_type,
                    current_occupancy=round(occ, 1),
                    status="SPACE_AVAILABLE",
                    suggested_action="Optimal coach for boarding; high seating availability.",
                    target_migration_coach=None,
                    passengers_to_divert=0,
                    display_board_message=display_msg,
                    pillar_bay=pillar_bay,
                    display_board_message_mr=display_msg_mr
                ))
            else:
                display_msg = f"COACH {coach.coach_no} NORMAL ({round(occ)}%) - {pillar_bay}"
                display_msg_mr = f"डबा {coach.coach_no} सामान्य ({round(occ)}%) - {pillar_bay}"
                advisories.append(CoachBalancingAdvisory(
                    coach_no=coach.coach_no,
                    coach_type=coach.coach_type,
                    current_occupancy=round(occ, 1),
                    status="MODERATE",
                    suggested_action="Standard boarding proceeding.",
                    target_migration_coach=None,
                    passengers_to_divert=0,
                    display_board_message=display_msg,
                    pillar_bay=pillar_bay,
                    display_board_message_mr=display_msg_mr
                ))

        # Overall PA Announcement text
        if diversion_announcements:
            audio_announcement = (
                f"Attention passengers on Platform {req.platform_no}. Train {req.train_number}: "
                + " ".join(diversion_announcements[:2])
                + " Please distribute evenly along the platform to avoid congestion."
            )
            audio_announcement_mr = (
                f"प्लॅटफॉर्म क्रमांक {req.platform_no} वरील प्रवाशांचे लक्ष असो. गाडी क्रमांक {req.train_number}: "
                + " ".join(diversion_announcements_mr[:2])
                + " प्रवाशांनी सुरळीत प्रवासासाठी समान वितरण करावे."
            )
            ticker = f"PLATFORM {req.platform_no} | TRAIN {req.train_number} | " + " | ".join([a.display_board_message for a in advisories if "FULL" in a.display_board_message][:3])
        else:
            audio_announcement = (
                f"Attention passengers on Platform {req.platform_no}. Train {req.train_number} has balanced passenger load across all coaches. "
                "Please board safely."
            )
            audio_announcement_mr = (
                f"प्लॅटफॉर्म क्रमांक {req.platform_no} वरील प्रवाशांचे लक्ष असो. गाडी क्रमांक {req.train_number} मधील सर्व डब्यांमध्ये भार संतुलित आहे. कृपया सुरक्षितपणे चढा."
            )
            ticker = f"PLATFORM {req.platform_no} | TRAIN {req.train_number} | LOAD BALANCED ACROSS ALL COACHES | BOARD SAFELY"

        return CrowdBalancingResponse(
            train_id=req.train_id,
            train_number=req.train_number,
            platform_no=req.platform_no,
            overall_train_occupancy=round(overall_occ, 1),
            imbalance_index=round(imbalance_index, 2),
            advisories=advisories,
            audio_chime_announcement=audio_announcement,
            audio_announcement_mr=audio_announcement_mr,
            led_display_ticker=ticker,
            rake_to_platform_mapping_status="CONFIGURED_STATION_BAY_MAPPING"
        )

# Global singleton
crowd_balancing_engine = PlatformCrowdBalancingEngine()
