# Act I — thống kê quái và phạm vi animation

Phạm vi: Diablo II cổ điển, Act I; chưa tính Secret Cow Level, NPC, lính thuê và triệu hồi của người chơi.

## Số mục đã kiểm chứng trên danh mục Blizzard

- 21 mục ở Act I Bestiary.
- 13 nhân vật/quái đặc biệt ở Act I Super Unique Monsters, trong đó có Andariel.
- Tổng cộng 34 mục theo hai danh mục; KHÔNG phải 34 model hoặc 34 bộ animation độc lập. Bestiary là danh mục tham khảo theo Act, không thay thế kiểm tra danh sách spawn của từng khu vực/độ khó/phiên bản.

## 21 mục Bestiary

1. Fallen
2. Fallen Shaman
3. Spike Fiend
4. Zombie
5. Wendigo
6. Corrupt Rogue
7. Corrupt Rogue Archer
8. Corrupt Rogue Spearwoman
9. Skeleton
10. Skeleton Archer
11. Skeleton Mage
12. Goatman
13. Blood Hawk
14. Tainted
15. Giant Spider
16. Wraith
17. Fetish
18. Vampire
19. Flying Scimitar
20. Blood Hawk Nest
21. Gargoyle Trap

## 13 mục đặc biệt, đã bao gồm boss cuối Act

1. Corpsefire
2. Bishibosh
3. Bonebreaker
4. Blood Raven
5. Coldcrow
6. Rakanishu
7. Treehead Woodfist
8. Griswold
9. The Countess
10. Pitspawn Fouldog
11. Bone Ash
12. The Smith
13. Andariel

Không cộng Andariel lần nữa. Các quái đặc biệt dùng lại hình gốc không mặc nhiên cần sản xuất toàn bộ animation mới. Màu, hiệu ứng thuộc tính và kỹ năng riêng cần được quản lý tách biệt.

## Animation

Chưa có số tổng animation gốc đã xác minh. Checklist động tác để kiểm kê từng quái: chờ, di chuyển, tấn công chính, tấn công phụ nếu có, trúng đòn nếu có, chết, thi triển phép, hành động đặc thù. Đánh dấu phần dùng lại, không áp đủ mọi động tác cho mọi quái. Tổ và bẫy cần bộ trạng thái riêng thay vì bộ đi/đánh của sinh vật.

Bảng kiểm kê chính xác cần các cột: quái, token hình ảnh, mode/động tác, số hướng, số frame mỗi hướng, thành phần cơ thể/trang bị, bộ hình dùng chung, VFX đi kèm. Phải đối chiếu dữ liệu spawn Act I với MonStats/MonStats2 và COF/DCC đúng phiên bản.

Phân biệt: một động tác nhìn theo 8 hướng có thể được gọi là một animation trong ngân sách chuyển động, nhưng là 8 chuỗi ảnh khi xuất sprite. Tổng frame còn phụ thuộc độ dài từng chuỗi và thành phần. Vì vậy mọi con số animation phải nêu đơn vị đếm.

## Nguồn

- https://classic.battle.net/diablo2exp/monsters/act1.shtml
- https://classic.battle.net/diablo2exp/monsters/act1-superuniques.shtml

Số 21 và 13 là kết quả đếm mục trên hai trang, không phải số lượng do Blizzard công bố như một tổng asset.
