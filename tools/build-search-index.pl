#!/usr/bin/env perl
# ============================================================
#  build-search-index.pl  ·  static half of the site search
# ============================================================
#
#  Walks the published .html pages and writes assets/search-index.json:
#  one record per page with its title, description, headings and a
#  trimmed run of body text. The site search loads that file for pages
#  and pulls everything else (news, events, documents, projects) live
#  from the same feeds the pages themselves use, so only a NEW PAGE
#  needs this script re-run:
#
#      perl tools/build-search-index.pl
#
#  Nothing here is hand-written per page — add a page and it is indexed.
# ============================================================
use strict;
use warnings;

my $ROOT = shift || '.';
my $OUT  = "$ROOT/assets/search-index.json";

# Pages that are not content: error page, internal brand reference.
my %SKIP = map { $_ => 1 } qw(404.html brandkit.html);

# Content type per page. Anything unlisted is a plain "Page", so a new
# page still lands in the index without touching this table.
my %TYPE = (
  'ggi.html'                        => 'Programme',
  'gefund.html'                     => 'Programme',
  'erc.html'                        => 'Programme',
  'move.html'                       => 'Programme',
  'matching.html'                   => 'Programme',
  'visegrad-fellowship.html'        => 'Programme',
  'regional-academy.html'           => 'Programme',
  'peer-to-peer.html'               => 'Programme',
  'our-programs.html'               => 'Programme',
  'about.html'                      => 'About',
  'about-governance.html'           => 'About',
  'about-team.html'                 => 'About',
  'about-careers.html'              => 'About',
  'about-strategic-plan.html'       => 'About',
  'wbfdocuments.html'               => 'Documents',
  'ourgrantees.html'                => 'Projects',
  'news.html'                       => 'News',
  'events.html'                     => 'Events',
  'past-events.html'                => 'Events',
  'regional-dialogue-sessions.html' => 'Events',
  'procurement.html'                => 'Documents',
);

sub decode_entities {
  my ($s) = @_;
  $s =~ s/&nbsp;/ /g;      $s =~ s/&amp;/&/g;
  $s =~ s/&lt;/</g;        $s =~ s/&gt;/>/g;
  $s =~ s/&quot;/"/g;      $s =~ s/&#39;/'/g;
  $s =~ s/&rsquo;/\x{2019}/g;  $s =~ s/&lsquo;/\x{2018}/g;
  $s =~ s/&ldquo;/\x{201C}/g;  $s =~ s/&rdquo;/\x{201D}/g;
  $s =~ s/&ndash;/\x{2013}/g;  $s =~ s/&mdash;/\x{2014}/g;
  $s =~ s/&middot;/\x{00B7}/g; $s =~ s/&euro;/\x{20AC}/g;
  $s =~ s/&[a-zA-Z]+;/ /g;
  $s =~ s/&#\d+;/ /g;
  return $s;
}

sub squeeze {
  my ($s) = @_;
  $s = decode_entities($s);
  $s =~ s/\s+/ /g;
  $s =~ s/^\s+|\s+$//g;
  return $s;
}

# Removes an element and everything inside it, matching nesting so a wrapper
# containing others of the same tag is cut at the right place. Used for
# content that is hidden on the page: a reader cannot see it, so a search
# result must not quote it.
sub drop_hidden {
  my ($html) = @_;
  while ($html =~ /<(section|div|article|aside|p|span|a)\b[^>]*style\s*=\s*"[^"]*display\s*:\s*none[^"]*"[^>]*>/i) {
    my $tag   = lc $1;
    my $start = $-[0];
    my $pos   = $+[0];
    my $depth = 1;
    while ($depth > 0 && $html =~ /<(\/?)$tag\b[^>]*>/gi) {
      last if pos($html) <= $pos && $-[0] < $pos;
      next if $-[0] < $pos;
      $depth += $1 ? -1 : 1;
      $pos = $+[0];
      last if $depth == 0;
    }
    # Unbalanced markup: cut to the end rather than looping forever.
    $pos = length($html) if $depth > 0;
    substr($html, $start, $pos - $start) = ' ';
  }
  return $html;
}

sub strip_tags {
  my ($s) = @_;
  $s =~ s/<[^>]*>/ /gs;
  return squeeze($s);
}

sub json_str {
  my ($s) = @_;
  $s = '' unless defined $s;
  $s =~ s/\\/\\\\/g;
  $s =~ s/"/\\"/g;
  $s =~ s/\n/ /g; $s =~ s/\r/ /g; $s =~ s/\t/ /g;
  $s =~ s/([\x00-\x1f])/sprintf('\\u%04x', ord($1))/ge;
  return '"' . $s . '"';
}

opendir(my $dh, $ROOT) or die "Cannot read $ROOT: $!";
my @pages = sort grep { /\.html$/ && !$SKIP{$_} } readdir($dh);
closedir($dh);

my @records;
for my $file (@pages) {
  open(my $fh, '<:encoding(UTF-8)', "$ROOT/$file") or do {
    warn "skipping $file: $!\n"; next;
  };
  my $html = do { local $/; <$fh> };
  close($fh);

  # Drop anything that is not readable page copy.
  $html =~ s/<!--.*?-->//gs;
  $html =~ s/<script\b.*?<\/script>//gsi;
  $html =~ s/<style\b.*?<\/style>//gsi;
  $html =~ s/<svg\b.*?<\/svg>//gsi;
  $html =~ s/<noscript\b.*?<\/noscript>//gsi;
  $html = drop_hidden($html);

  my ($title) = $html =~ /<title[^>]*>(.*?)<\/title>/si;
  $title = squeeze($title || $file);
  # The site suffix is noise in a result list.
  $title =~ s/\s*[\x{2014}\x{2013}|-]\s*Western Balkans Fund\s*$//;

  my ($desc) = $html =~ /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/si;
  $desc = squeeze($desc || '');

  my @heads;
  while ($html =~ /<h([1-3])\b[^>]*>(.*?)<\/h\1>/gsi) {
    my $h = strip_tags($2);
    push @heads, $h if length($h) > 2 && length($h) < 120;
  }
  # De-duplicate while keeping order.
  my (%seen, @uniq);
  for my $h (@heads) { next if $seen{lc $h}++; push @uniq, $h; }
  @uniq = @uniq[0 .. 39] if @uniq > 40;

  my ($body) = $html =~ /<body[^>]*>(.*)<\/body>/si;
  $body = $html unless defined $body;
  my $text = strip_tags($body);
  # Enough for matching and snippets without bloating the index.
  $text = substr($text, 0, 2200) if length($text) > 2200;

  my $type = $TYPE{$file} || 'Page';

  push @records, join('',
    '{',
      '"url":',   json_str('/' . $file), ',',
      '"title":', json_str($title), ',',
      '"type":',  json_str($type), ',',
      '"desc":',  json_str($desc), ',',
      '"heads":[', join(',', map { json_str($_) } @uniq), '],',
      '"text":',  json_str($text),
    '}'
  );
}

open(my $out, '>:encoding(UTF-8)', $OUT) or die "Cannot write $OUT: $!";
print $out "[\n", join(",\n", @records), "\n]\n";
close($out);

printf "search-index.json — %d pages, %d bytes\n",
  scalar(@records), -s $OUT;
