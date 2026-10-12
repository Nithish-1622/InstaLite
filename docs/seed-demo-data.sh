#!/usr/bin/env bash
# ------------------------------------------------------------------
# Demo content for InstaLite.
#
#   1. generates avatar images, post images and two short videos with
#      ffmpeg (they land in instagram-backend/uploads/)
#   2. gives every demo user an avatar
#   3. publishes more posts through the REST API
#   4. adds likes, comments and follows so the feed feels alive
#   5. spreads the post timestamps over the last days
#
# Run it while the backend is running on http://localhost:8080:
#   bash docs/seed-demo-data.sh
# ------------------------------------------------------------------
set -u
B=${API_BASE:-http://localhost:8080}
UP=instagram-backend/uploads
MYSQL_PASSWORD=${MYSQL_PASSWORD:-nith@123}
FONT=instagram-backend/target/arial.ttf

mkdir -p "$UP"
[ -f "$FONT" ] || cp /c/Windows/Fonts/arial.ttf "$FONT"

sql() { mysql -uroot -p"$MYSQL_PASSWORD" -e "$1" 2>/dev/null; }

# ------------------------------------------------------------------
# 1. media files
# ------------------------------------------------------------------
echo "== generating images/videos =="

avatar() { # avatar <file> <color0> <color1> <letter>
  [ -f "$UP/$1" ] && return 0
  ffmpeg -y -loglevel error -f lavfi \
    -i "gradients=s=512x512:c0=$2:c1=$3:type=radial:seed=7:speed=0" -frames:v 1 \
    -vf "drawtext=fontfile=$FONT:text='$4':fontsize=240:fontcolor=white:x=(w-tw)/2:y=(h-th)/2" \
    "$UP/$1"
}

post_image() { # post_image <file> <color0> <color1> <title>
  [ -f "$UP/$1" ] && return 0
  ffmpeg -y -loglevel error -f lavfi \
    -i "gradients=s=900x900:c0=$2:c1=$3:type=radial:seed=11:speed=0" -frames:v 1 \
    -vf "drawbox=x=0:y=ih*0.74:w=iw:h=ih*0.26:color=0x000000@0.30:t=fill,\
drawtext=fontfile=$FONT:text='$4':fontsize=52:fontcolor=white:x=(w-tw)/2:y=h*0.80,\
drawtext=fontfile=$FONT:text='InstaLite':fontsize=26:fontcolor=white@0.85:x=(w-tw)/2:y=h*0.90" \
    "$UP/$1"
}

post_video() { # post_video <file> <color0> <color1> <title>
  [ -f "$UP/$1" ] && return 0
  ffmpeg -y -loglevel error -f lavfi \
    -i "gradients=s=854x480:c0=$2:c1=$3:type=linear:seed=3:speed=0.06:duration=4" \
    -t 4 \
    -vf "drawbox=x=0:y=ih*0.76:w=iw:h=ih*0.24:color=0x000000@0.30:t=fill,\
drawtext=fontfile=$FONT:text='$4':fontsize=42:fontcolor=white:x=(w-tw)/2:y=h*0.82" \
    -c:v libx264 -pix_fmt yuv420p -preset veryfast -movflags +faststart "$UP/$1"
}

avatar avatar-alice.png  0xe1306c 0xf77737 A
avatar avatar-bob.png    0x405de6 0x833ab4 B
avatar avatar-charlie.png 0x5851db 0xc13584 C
avatar avatar-nithish.png 0xfeda75 0xfa7e1e N
avatar avatar-dave.png   0x833ab4 0xfd1d1d D
avatar avatar-emma.png   0x4caf50 0x009688 E
avatar avatar-frank.png  0x2196f3 0x3f51b5 F

post_image post-beach.jpg   0xff9966 0xff5e62 "Golden hour at the beach"
post_image post-city.jpg    0x30cfd0 0x5b4b8a "City lights never sleep"
post_image post-mountain.jpg 0x56ab2f 0xa8e063 "Mountain trail run"
post_image post-coffee.jpg  0xc79081 0xdfa579 "Morning coffee ritual"
post_image post-food.jpg    0xf83600 0xf9d423 "Street food tour"
post_image post-neon.jpg    0xfc466b 0x3f5efb "Neon nights downtown"
post_image post-ocean.jpg   0x2193b0 0x6dd5ed "Ocean waves therapy"
post_image post-forest.jpg  0x134e5e 0x71b280 "Forest walk with friends"

post_video video-desert.mp4 0xffb347 0xff5e62 "Desert road trip"
post_video video-skate.mp4  0x8e2de2 0x4a00e0 "Skate park session"

ls "$UP" | wc -l | xargs echo "files in uploads/:"

# ------------------------------------------------------------------
# 2. avatars for the users that already exist
# ------------------------------------------------------------------
echo "== setting avatars =="
sql "UPDATE instagram_db.users SET profile_image='/uploads/avatar-alice.png'  WHERE username='alice';"
sql "UPDATE instagram_db.users SET profile_image='/uploads/avatar-bob.png'    WHERE username='bob';"
sql "UPDATE instagram_db.users SET profile_image='/uploads/avatar-charlie.png' WHERE username='charlie';"
sql "UPDATE instagram_db.users SET profile_image='/uploads/avatar-nithish.png' WHERE username='nithish_jag';"

# ------------------------------------------------------------------
# 3. three more users with avatars
# ------------------------------------------------------------------
new_user() { # new_user <username> <avatar>
  curl -s -X POST "$B/api/users" -H 'Content-Type: application/json' \
    -d "{\"username\":\"$1\",\"profileImage\":\"/uploads/$2\"}" > /dev/null
}
new_user dave  avatar-dave.png
new_user emma  avatar-emma.png
new_user frank avatar-frank.png

id_of() {
  curl -s "$B/api/users" | python -c "import sys,json;u=json.load(sys.stdin);print(next((x['id'] for x in u if x['username']=='$1'),''))"
}

ALICE=$(id_of alice); BOB=$(id_of bob); CHARLIE=$(id_of charlie)
NITHISH=$(id_of nithish_jag); DAVE=$(id_of dave); EMMA=$(id_of emma); FRANK=$(id_of frank)
echo "user ids: alice=$ALICE bob=$BOB charlie=$CHARLIE nithish=$NITHISH dave=$DAVE emma=$EMMA frank=$FRANK"

# ------------------------------------------------------------------
# 4. more posts (skip when they are already there)
# ------------------------------------------------------------------
post_ids() {
  curl -s "$B/api/posts" | python -c "import sys,json;print(','.join(str(p['id']) for p in json.load(sys.stdin)))"
}

POSTS=$(curl -s "$B/api/posts" | grep -o '"mediaUrl"' | wc -l | tr -d ' ')
PIDS=()
if [ "$POSTS" -lt 10 ]; then
  echo "== publishing posts =="
  publish() { # publish <user> <file> <caption>
    RESP=$(curl -s -X POST "$B/api/posts" -F "file=@$UP/$2" -F "caption=$3" -F "userId=$1")
    PID=$(echo "$RESP" | python -c "import sys,json;d=json.load(sys.stdin);print(d.get('id',''))" 2>/dev/null)
    if [ -z "$PID" ]; then echo "  FAILED $2: $RESP"; else echo "  post $PID <- $2 ($3)"; fi
    PIDS+=("$PID")
  }
  publish "$ALICE"   post-beach.jpg    "Golden hour at the beach #sunset"
  publish "$BOB"     post-city.jpg     "City lights never sleep"
  publish "$CHARLIE" post-mountain.jpg "Mountain trail run #hiking"
  publish "$DAVE"    post-coffee.jpg   "Morning coffee ritual"
  publish "$EMMA"    post-food.jpg     "Street food tour continues"
  publish "$FRANK"   video-desert.mp4 "Desert road trip"
  publish "$ALICE"   post-neon.jpg     "Neon nights downtown"
  publish "$BOB"     post-ocean.jpg    "Ocean waves therapy"
  publish "$EMMA"    post-forest.jpg   "Forest walk with friends"
  publish "$NITHISH" video-skate.mp4   "Skate park session"
else
  echo "== posts already seeded ($POSTS), skipping upload =="
  # collect the ids so likes/comments below still work
  IFS=',' read -r -a PIDS <<< "$(post_ids)"
fi

# ------------------------------------------------------------------
# 5. likes, comments and follows
# ------------------------------------------------------------------
echo "== likes, comments, follows =="
like()  { curl -s -o /dev/null -X POST "$B/api/posts/$1/likes?userId=$2"; }
follow(){ curl -s -o /dev/null -X POST "$B/api/users/$1/follow?followerId=$2"; }
comment(){ curl -s -o /dev/null -X POST "$B/api/posts/$1/comments" -H 'Content-Type: application/json' -d "{\"userId\":$2,\"text\":\"$3\"}"; }

if [ "$POSTS" -lt 10 ]; then
  i=0
  for pid in "${PIDS[@]}"; do
    [ -z "$pid" ] && continue
    like "$pid" "$BOB"
    like "$pid" "$CHARLIE"
    [ $((i % 2)) -eq 0 ] && like "$pid" "$EMMA"
    comment "$pid" "$BOB"     "This is amazing!"
    [ $((i % 2)) -eq 1 ] && comment "$pid" "$EMMA" "Need to go here asap"
    [ $((i % 3)) -eq 0 ] && comment "$pid" "$DAVE" "Great shot, love the colours"
    i=$((i + 1))
  done
fi

follow "$ALICE" "$BOB"; follow "$ALICE" "$CHARLIE"; follow "$ALICE" "$EMMA"; follow "$ALICE" "$NITHISH"
follow "$BOB" "$ALICE"; follow "$BOB" "$DAVE"; follow "$BOB" "$FRANK"
follow "$CHARLIE" "$DAVE"; follow "$DAVE" "$EMMA"; follow "$EMMA" "$FRANK"; follow "$FRANK" "$ALICE"
follow "$NITHISH" "$BOB"; follow "$CHARLIE" "$NITHISH"

# ------------------------------------------------------------------
# 6. spread the timestamps over the last days
# ------------------------------------------------------------------
echo "== spreading timestamps =="
i=0
for pid in "${PIDS[@]}"; do
  [ -z "$pid" ] && continue
  sql "UPDATE instagram_db.posts SET created_at = DATE_SUB(NOW(), INTERVAL $((i * 9 + 4)) HOUR) WHERE id=$pid;"
  i=$((i + 1))
done

echo "== done =="
curl -s "$B/api/posts" | grep -o '"caption":"[^"]*"' | head -20
