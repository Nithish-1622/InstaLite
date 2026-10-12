#!/usr/bin/env bash
# API smoke test for the Instagram backend.
#
#   1. make sure Spring Boot is running on http://localhost:8080
#   2. bash docs/api-smoke.sh
#
# It creates its own fixture files under instagram-backend/target/ and prints
# PASS/FAIL for every endpoint (exit code 0 = everything passed).
B=http://localhost:8080
OUT="$PWD/instagram-backend/target"
mkdir -p "$OUT"
JPG="$OUT/smoke.jpg"
MP4="$OUT/smoke.mp4"
TXT="$OUT/smoke.txt"
pass=0; fail=0; has_ffmpeg=0

chk() { # chk <description> <expected> <actual>
  if [ "$2" = "$3" ]; then
    echo "PASS  $1 -> $3"
    pass=$((pass+1))
  else
    echo "FAIL  $1 -> expected [$2] got [$3]"
    fail=$((fail+1))
  fi
}

# --- fixture files ---------------------------------------------------------
# 1x1 JPEG
echo "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==" | base64 -d > "$JPG"
echo "this is not media" > "$TXT"
if command -v ffmpeg > /dev/null 2>&1; then
  ffmpeg -loglevel error -f lavfi -i "testsrc=size=320x240:rate=15" -t 1 -pix_fmt yuv420p "$MP4" -y \
    && has_ffmpeg=1
fi

# --- wait for the backend --------------------------------------------------
for i in $(seq 1 45); do
  c=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$B/api/users" 2>/dev/null)
  [ "$c" = "200" ] && break
  sleep 2
done

echo "--- users ---"
c=$(curl -s -o /dev/null -w '%{http_code}' "$B/api/users"); chk "GET /api/users" 200 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/users" -H 'Content-Type: application/json' -d '{"username":"charlie"}')
chk "POST /api/users new" 201 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/users" -H 'Content-Type: application/json' -d '{"username":"charlie"}')
chk "POST /api/users duplicate" 400 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/users" -H 'Content-Type: application/json' -d '{"username":"   "}')
chk "POST /api/users blank" 400 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' "$B/api/users/1?followerId=3"); chk "GET /api/users/1" 200 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' "$B/api/users/999"); chk "GET /api/users/999" 404 "$c"

echo "--- upload media ---"
c=$(curl -s -o "$OUT/resp-post1.json" -w '%{http_code}' -X POST "$B/api/posts" \
    -F "file=@$JPG" -F "caption=Blue square" -F "userId=1")
chk "POST /api/posts image" 201 "$c"
POST1=$(grep -o '"id":[0-9]*' "$OUT/resp-post1.json" | head -1 | cut -d: -f2)
MEDIA1=$(grep -o '"mediaUrl":"[^"]*"' "$OUT/resp-post1.json" | cut -d'"' -f4)
MT1=$(grep -o '"mediaType":"[^"]*"' "$OUT/resp-post1.json" | cut -d'"' -f4)
echo "      post id=$POST1 media=$MEDIA1 type=$MT1"
[ "$MT1" = "IMAGE" ] && { echo "PASS  mediaType is IMAGE"; pass=$((pass+1)); } || { echo "FAIL  mediaType=$MT1"; fail=$((fail+1)); }
c=$(curl -s -o /dev/null -w '%{http_code}' "$B$MEDIA1"); chk "GET media file from /uploads" 200 "$c"

if [ "$has_ffmpeg" = "1" ]; then
  c=$(curl -s -o "$OUT/resp-post2.json" -w '%{http_code}' -X POST "$B/api/posts" \
      -F "file=@$MP4" -F "caption=Short clip" -F "userId=3")
  chk "POST /api/posts video" 201 "$c"
  POST2=$(grep -o '"id":[0-9]*' "$OUT/resp-post2.json" | head -1 | cut -d: -f2)
  MT2=$(grep -o '"mediaType":"[^"]*"' "$OUT/resp-post2.json" | cut -d'"' -f4)
  echo "      post id=$POST2 type=$MT2"
  [ "$MT2" = "VIDEO" ] && { echo "PASS  mediaType is VIDEO"; pass=$((pass+1)); } || { echo "FAIL  mediaType=$MT2"; fail=$((fail+1)); }
else
  echo "SKIP  video upload (ffmpeg not installed)"
fi

c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/posts" -F "file=@$TXT" -F "caption=bad" -F "userId=1")
chk "POST /api/posts wrong file type" 400 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/posts" -F "caption=no file" -F "userId=1")
chk "POST /api/posts missing file" 400 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/posts" -F "file=@$JPG" -F "caption=x" -F "userId=999")
chk "POST /api/posts unknown user" 404 "$c"

echo "--- feed and post details ---"
c=$(curl -s -o "$OUT/resp-feed.json" -w '%{http_code}' "$B/api/posts?currentUserId=2"); chk "GET /api/posts" 200 "$c"
N=$(grep -o '"id":[0-9]*' "$OUT/resp-feed.json" | wc -l | tr -d ' ')
[ "$N" -ge 2 ] && { echo "PASS  feed has >=2 posts ($N)"; pass=$((pass+1)); } || { echo "FAIL  feed posts=$N"; fail=$((fail+1)); }
c=$(curl -s -o "$OUT/resp-feed-u1.json" -w '%{http_code}' "$B/api/posts?userId=1&currentUserId=2"); chk "GET /api/posts?userId=1" 200 "$c"
N=$(grep -o '"user":{' "$OUT/resp-feed-u1.json" | wc -l | tr -d ' ')
[ "$N" = "1" ] && { echo "PASS  filter returns 1 post for user 1"; pass=$((pass+1)); } || { echo "FAIL  filter posts=$N"; fail=$((fail+1)); }
c=$(curl -s -o /dev/null -w '%{http_code}' "$B/api/posts/$POST1?currentUserId=2"); chk "GET /api/posts/{id}" 200 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' "$B/api/posts/999"); chk "GET /api/posts/999" 404 "$c"

echo "--- likes ---"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/posts/$POST1/likes?userId=2")
chk "POST likes (bob likes alice)" 201 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/posts/$POST1/likes?userId=2")
chk "POST likes duplicate" 400 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/posts/999/likes?userId=2")
chk "POST likes unknown post" 404 "$c"
L=$(curl -s "$B/api/posts/$POST1?currentUserId=2")
echo "$L" | grep -q '"likeCount":1' && { echo "PASS  likeCount=1"; pass=$((pass+1)); } || { echo "FAIL  likeCount: $L"; fail=$((fail+1)); }
echo "$L" | grep -q '"likedByCurrentUser":true' && { echo "PASS  likedByCurrentUser=true"; pass=$((pass+1)); } || { echo "FAIL  likedByCurrentUser"; fail=$((fail+1)); }
A=$(curl -s "$B/api/posts/$POST1?currentUserId=1")
echo "$A" | grep -q '"likedByCurrentUser":false' && { echo "PASS  likedByCurrentUser=false for other user"; pass=$((pass+1)); } || { echo "FAIL  likedByCurrentUser for other user: $A"; fail=$((fail+1)); }
c=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "$B/api/posts/$POST1/likes?userId=2")
chk "DELETE likes (unlike)" 200 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "$B/api/posts/$POST1/likes?userId=2")
chk "DELETE likes again" 400 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/posts/$POST1/likes?userId=2")
chk "POST likes re-like" 201 "$c"

echo "--- follows ---"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/users/1/follow?followerId=2")
chk "POST follow (bob -> alice)" 201 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/users/1/follow?followerId=2")
chk "POST follow duplicate" 400 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/users/2/follow?followerId=2")
chk "POST follow self" 400 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/users/999/follow?followerId=2")
chk "POST follow unknown user" 404 "$c"
P=$(curl -s "$B/api/users/1?followerId=2")
echo "$P" | grep -q '"followersCount":1' && { echo "PASS  followersCount=1"; pass=$((pass+1)); } || { echo "FAIL  followersCount: $P"; fail=$((fail+1)); }
echo "$P" | grep -q '"following":true' && { echo "PASS  following=true"; pass=$((pass+1)); } || { echo "FAIL  following flag"; fail=$((fail+1)); }
c=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "$B/api/users/1/follow?followerId=2")
chk "DELETE unfollow" 200 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "$B/api/users/1/follow?followerId=2")
chk "DELETE unfollow again" 400 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/users/1/follow?followerId=2")
chk "POST follow again (final state)" 201 "$c"

echo "--- comments ---"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/posts/$POST1/comments" \
    -H 'Content-Type: application/json' -d '{"userId":2,"text":"Great shot!"}')
chk "POST comment" 201 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/posts/$POST1/comments" \
    -H 'Content-Type: application/json' -d '{"userId":2,"text":"   "}')
chk "POST comment blank" 400 "$c"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/api/posts/999/comments" \
    -H 'Content-Type: application/json' -d '{"userId":2,"text":"hi"}')
chk "POST comment unknown post" 404 "$c"
c=$(curl -s -o "$OUT/resp-comments.json" -w '%{http_code}' "$B/api/posts/$POST1/comments")
chk "GET comments" 200 "$c"
grep -q '"username":"bob"' "$OUT/resp-comments.json" && { echo "PASS  comment carries author username"; pass=$((pass+1)); } || { echo "FAIL  comment payload"; fail=$((fail+1)); }
c=$(curl -s -o /dev/null -w '%{http_code}' "$B/api/posts/999/comments"); chk "GET comments unknown post" 404 "$c"
c=$(curl -s -o "$OUT/resp-final.json" -w '%{http_code}' "$B/api/posts/$POST1?currentUserId=2")
FINAL=$(cat "$OUT/resp-final.json")
echo "$FINAL" | grep -q '"commentCount":1' && { echo "PASS  commentCount=1"; pass=$((pass+1)); } || { echo "FAIL  commentCount: $FINAL"; fail=$((fail+1)); }

echo ""
echo "RESULT: $pass passed, $fail failed"
[ "$fail" = "0" ]
