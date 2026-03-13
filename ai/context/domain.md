## Domain: endurance training analysis

### Key concepts:
An application for analyzing Strava workouts that allows 
users to export reports in JSON format. 
These reports can be fed into an LLM to receive personalized 
suggestions (note: the LLM integration itself is outside 
the scope of this project).

Activity
- id
- type
- distance
- moving_time
- elevation_gain
- average_heartrate

Derived metrics
- pace
- effort score
- hr zones

TOON generation
- possibility of TOON (Token-Oriented Object Notation) based data derived from Strava API