require "language/node"

class Backpack < Formula
  desc "Backpack"
  homepage "https://github.com/robvanderleek/backpack"
  url "https://registry.npmjs.org/@robvanderleek/backpack/-/backpack-0.0.1-development.tgz"
  sha256 "d08440d50cc6fa776c7c0afeccd1dae4f9b16d25fadbbb9ab26d9710c17fd763"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    # add a meaningful test here
  end
end
